import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight, parseAllowedOrigins } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";
import { z } from "npm:zod@3.23.8";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const origins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

const handler = async (req: Request): Promise<Response> => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req, origins);
  const pf = handlePreflight(req, origins, { 'x-request-id': requestId });
  if (pf) return pf;

  try {
    if (req.method !== 'POST') {
      return jsonError(405, 'Method not allowed', { requestId }, { ...ch, 'x-request-id': requestId });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError(401, 'Missing authorization header', { requestId }, { ...ch, 'x-request-id': requestId });
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonError(401, 'Invalid token', { requestId }, { ...ch, 'x-request-id': requestId });
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return jsonError(403, 'Insufficient permissions', { requestId }, { ...ch, 'x-request-id': requestId });
    }

    const payload = await req.json().catch(() => ({}));
    const EXPECTED = {
      email: 'user@example.com',
      role: 'ADMIN',
      data_access_level: 'FULL',
      org_id: profile.organization_id ?? ''
    };
    const ReqSchema = z.object({
      email: z.string().email(),
      role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']),
      data_access_level: z.enum(['FULL', 'MASKED', 'NONE']),
      org_id: z.string(),
    });
    const result = ReqSchema.safeParse(payload);
    if (!result.success) {
      return jsonError(400, 'Payload inválido', { issues: result.error.issues, expected: EXPECTED, requestId }, { ...ch, 'x-request-id': requestId });
    }
    const { email, role, data_access_level, org_id } = result.data;

    // Check if user belongs to the organization
    if (profile.organization_id !== org_id) {
      return jsonError(403, 'Organization mismatch', { requestId }, { ...ch, 'x-request-id': requestId });
    }

    // Check if user already exists in the organization
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('organization_id', org_id)
      .single();

    if (existingProfile) {
      return jsonError(400, 'User already exists in this organization', { requestId }, { ...ch, 'x-request-id': requestId });
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', email)
      .eq('org_id', org_id)
      .eq('status', 'PENDING')
      .single();

    if (existingInvitation) {
      return jsonError(400, 'Invitation already pending for this email', { requestId }, { ...ch, 'x-request-id': requestId });
    }

    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invitation_token');

    if (tokenError || !tokenData) {
      throw new Error('Failed to generate invitation token');
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .insert({
        org_id,
        email,
        role,
        data_access_level,
        invited_by: user.id,
        invitation_token: tokenData,
        status: 'PENDING'
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Get organization details for email
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', org_id)
      .single();

    if (orgError) {
      throw orgError;
    }

    // Log the action
    await supabase.rpc('log_user_action', {
      action_type: 'INVITE_USER',
      resource_type: 'user_invitations',
      resource_id: invitation.id,
      metadata: { email, role, data_access_level, org_id }
    });

    const siteUrl = Deno.env.get('VITE_PUBLIC_SITE_URL');

    if (!siteUrl) {
      console.warn(
        JSON.stringify({ requestId, warn: 'VITE_PUBLIC_SITE_URL is not defined' })
      );
      return jsonError(
        500,
        'VITE_PUBLIC_SITE_URL is not defined',
        { requestId },
        { ...ch, 'x-request-id': requestId }
      );
    }

    return json(200, {
      success: true,
      message: 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        data_access_level: invitation.data_access_level,
        expires_at: invitation.expires_at,
        invitation_url: `${siteUrl}/invite/${tokenData}`
      },
      requestId
    }, { ...ch, 'x-request-id': requestId });

  } catch (error: any) {
    console.error(JSON.stringify({ requestId, err: String(error) }));
    return jsonError(500, error.message || 'Internal server error', { requestId }, { ...ch, 'x-request-id': requestId });
  }
};

serve('user-invitations', handler);
