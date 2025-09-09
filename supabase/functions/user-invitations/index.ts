import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface InviteUserRequest {
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  data_access_level: 'FULL' | 'MASKED' | 'NONE';
  org_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, role, data_access_level, org_id }: InviteUserRequest = await req.json();

    // Validate input
    if (!email || !role || !data_access_level || !org_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user belongs to the organization
    if (profile.organization_id !== org_id) {
      return new Response(
        JSON.stringify({ error: 'Organization mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists in the organization
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('organization_id', org_id)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'User already exists in this organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Invitation already pending for this email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invitation_token');

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

    // TODO: Send email invitation using Resend or similar service
    // For now, just log the invitation details
    console.log(`Invitation created:`, {
      email,
      role,
      data_access_level,
      organization: org.name,
      token: tokenData,
      expires_at: invitation.expires_at
    });

    // Log the action
    await supabase.rpc('log_user_action', {
      action_type: 'INVITE_USER',
      resource_type: 'user_invitations',
      resource_id: invitation.id,
      metadata: {
        email,
        role,
        data_access_level,
        org_id
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation created successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          data_access_level: invitation.data_access_level,
          expires_at: invitation.expires_at,
          invitation_url: `${Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000'}/invite/${tokenData}`
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in user-invitations function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);