import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight, parseAllowedOrigins } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ManageUserRequest {
  action: 'activate' | 'deactivate' | 'change_role' | 'delete';
  user_id: string;
  role?: 'ADMIN' | 'ANALYST' | 'VIEWER';
  data_access_level?: 'FULL' | 'MASKED' | 'NONE';
}

const origins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

const handler = async (req: Request): Promise<Response> => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req, origins);
  const pre = handlePreflight(req, origins, { 'x-request-id': requestId });
  if (pre) return pre;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    // Get admin profile to check permissions
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single();

    if (adminProfileError || !adminProfile || adminProfile.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    const { action, user_id, role, data_access_level }: ManageUserRequest = await req.json();

    // Validate input
    if (!action || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    // Get target user profile
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .eq('organization_id', adminProfile.organization_id)
      .single();

    if (targetProfileError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'User not found in organization' }),
        { status: 404, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    // Prevent admin from modifying themselves in certain ways
    if (user.id === user_id && (action === 'deactivate' || action === 'delete')) {
      return new Response(
        JSON.stringify({ error: 'Cannot deactivate or delete your own account' }),
        { status: 400, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    let updateData: any = {};
    let actionMessage = '';

    switch (action) {
      case 'activate':
        updateData = { is_active: true };
        actionMessage = 'User activated successfully';
        break;
      
      case 'deactivate':
        updateData = { is_active: false };
        actionMessage = 'User deactivated successfully';
        break;
      
      case 'change_role':
        if (!role || !data_access_level) {
          return new Response(
            JSON.stringify({ error: 'Role and data access level required for role change' }),
            { status: 400, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
          );
        }
        updateData = { role, data_access_level };
        actionMessage = `User role changed to ${role} with ${data_access_level} access`;
        break;
      
      case 'delete':
        // Soft delete by marking as inactive and clearing sensitive data
        updateData = { 
          is_active: false,
          role: 'VIEWER',
          data_access_level: 'NONE'
        };
        actionMessage = 'User access revoked successfully';
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
        );
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user_id)
      .eq('organization_id', adminProfile.organization_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabase.rpc('log_user_action', {
      action_type: `USER_${action.toUpperCase()}`,
      resource_type: 'profiles',
      resource_id: updatedProfile.id,
      metadata: {
        target_user_id: user_id,
        target_email: targetProfile.email,
        action,
        previous_role: targetProfile.role,
        previous_data_access_level: targetProfile.data_access_level,
        new_role: role,
        new_data_access_level: data_access_level
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: actionMessage,
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          role: updatedProfile.role,
          data_access_level: updatedProfile.data_access_level,
          is_active: updatedProfile.is_active
        }
      }),
      { status: 200, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
    );

  } catch (error: any) {
    console.error('Error in manage-user-roles function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...ch, 'Content-Type': 'application/json', 'x-request-id': requestId } }
    );
  }
};

serve('manage-user-roles', handler);