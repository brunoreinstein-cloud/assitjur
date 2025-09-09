import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";
import { z } from "npm:zod@3.23.8";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pf = handlePreflight(req, cid);
  if (pf) return pf;

  try {
    if (req.method !== 'POST') {
      return jsonError(405, 'Method not allowed', { cid }, { ...ch, 'x-correlation-id': cid });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError(401, 'Missing authorization header', { cid }, { ...ch, 'x-correlation-id': cid });
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonError(401, 'Invalid token', { cid }, { ...ch, 'x-correlation-id': cid });
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return jsonError(403, 'Insufficient permissions', { cid }, { ...ch, 'x-correlation-id': cid });
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
      return jsonError(400, 'Payload inválido', { issues: result.error.issues, expected: EXPECTED, cid }, { ...ch, 'x-correlation-id': cid });
    }
    const { email, role, data_access_level, org_id } = result.data;

    // Check if user belongs to the organization
    if (profile.organization_id !== org_id) {
      return jsonError(403, 'Organization mismatch', { cid }, { ...ch, 'x-correlation-id': cid });
    }

    // Check if user already exists in the organization
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('organization_id', org_id)
      .single();

    if (existingProfile) {
      return jsonError(400, 'User already exists in this organization', { cid }, { ...ch, 'x-correlation-id': cid });
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
      return jsonError(400, 'Invitation already pending for this email', { cid }, { ...ch, 'x-correlation-id': cid });
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

    return json(200, {
      success: true,
      message: 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        data_access_level: invitation.data_access_level,
        expires_at: invitation.expires_at,
        invitation_url: `${Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000'}/invite/${tokenData}`
      },
      cid
    }, { ...ch, 'x-correlation-id': cid });

  } catch (error: any) {
    console.error(JSON.stringify({ cid, err: String(error) }));
    return jsonError(500, error.message || 'Internal server error', { cid }, { ...ch, 'x-correlation-id': cid });
  }
};

Deno.serve(handler);
