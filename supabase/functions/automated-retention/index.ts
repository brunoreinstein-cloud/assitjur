import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting automated retention cleanup job...');

    // Get all organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('is_active', true);

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      throw orgsError;
    }

    const results = [];

    // Process each organization
    for (const org of organizations || []) {
      console.log(`Processing organization: ${org.name} (${org.id})`);

      try {
        // Get policies eligible for cleanup (auto_cleanup = true, next_cleanup_at <= now)
        const { data: policies, error: policiesError } = await supabase
          .from('retention_policies')
          .select('id, table_name, retention_months, auto_cleanup, next_cleanup_at')
          .eq('org_id', org.id)
          .eq('auto_cleanup', true)
          .lte('next_cleanup_at', new Date().toISOString());

        if (policiesError) {
          console.error(`Error fetching policies for org ${org.id}:`, policiesError);
          continue;
        }

        console.log(`Found ${policies?.length || 0} policies eligible for cleanup in org ${org.name}`);

        const orgResults = [];

        // Execute cleanup for each eligible policy
        for (const policy of policies || []) {
          console.log(`Executing cleanup for table ${policy.table_name} in org ${org.name}`);

          try {
            const { data: cleanupResult, error: cleanupError } = await supabase.rpc('execute_retention_cleanup', {
              p_policy_id: policy.id
            });

            if (cleanupError) {
              console.error(`Cleanup failed for policy ${policy.id}:`, cleanupError);
              orgResults.push({
                policyId: policy.id,
                tableName: policy.table_name,
                success: false,
                error: cleanupError.message
              });
            } else {
              console.log(`Cleanup successful for ${policy.table_name}: ${cleanupResult.records_affected} records affected`);
              orgResults.push({
                policyId: policy.id,
                tableName: policy.table_name,
                success: true,
                recordsAffected: cleanupResult.records_affected
              });
            }
          } catch (error) {
            console.error(`Error executing cleanup for policy ${policy.id}:`, error);
            orgResults.push({
              policyId: policy.id,
              tableName: policy.table_name,
              success: false,
              error: error.message
            });
          }
        }

        results.push({
          orgId: org.id,
          orgName: org.name,
          policiesProcessed: orgResults.length,
          results: orgResults
        });

      } catch (error) {
        console.error(`Error processing organization ${org.id}:`, error);
        results.push({
          orgId: org.id,
          orgName: org.name,
          policiesProcessed: 0,
          error: error.message
        });
      }
    }

    // Log summary
    const totalPolicies = results.reduce((sum, org) => sum + org.policiesProcessed, 0);
    const successfulCleanups = results.reduce((sum, org) => 
      sum + (org.results?.filter(r => r.success).length || 0), 0
    );

    console.log(`Retention cleanup job completed:`);
    console.log(`- Organizations processed: ${results.length}`);
    console.log(`- Total policies processed: ${totalPolicies}`);
    console.log(`- Successful cleanups: ${successfulCleanups}`);

    // Create audit log entry
    await supabase
      .from('audit_logs')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        email: 'system@assistjur.ia',
        role: 'SYSTEM',
        organization_id: '00000000-0000-0000-0000-000000000000',
        action: 'AUTOMATED_RETENTION_CLEANUP',
        resource: 'retention_policies',
        result: 'SUCCESS',
        metadata: {
          organizations_processed: results.length,
          total_policies: totalPolicies,
          successful_cleanups: successfulCleanups,
          timestamp: new Date().toISOString(),
          results: results
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          organizationsProcessed: results.length,
          totalPolicies,
          successfulCleanups,
          timestamp: new Date().toISOString()
        },
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Automated Retention Cleanup Error:', error);
    
    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('audit_logs')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          email: 'system@assistjur.ia',
          role: 'SYSTEM',
          organization_id: '00000000-0000-0000-0000-000000000000',
          action: 'AUTOMATED_RETENTION_CLEANUP',
          resource: 'retention_policies',
          result: 'FAILED',
          metadata: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});