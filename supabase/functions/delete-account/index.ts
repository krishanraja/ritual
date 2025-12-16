import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      throw new Error('Database configuration missing');
    }

    // Create client with user's auth
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not found');
    }

    console.log(`Deleting account for user: ${user.id}`);

    // Create admin client for deletion
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
    );

    // First, handle couple cleanup
    // Check if user is partner_one in any couples
    const { data: couplesAsOne } = await supabaseAdmin
      .from('couples')
      .select('id')
      .eq('partner_one', user.id);

    // If user is partner_one, we need to either transfer or delete the couple
    if (couplesAsOne && couplesAsOne.length > 0) {
      for (const couple of couplesAsOne) {
        // Get full couple data
        const { data: coupleData } = await supabaseAdmin
          .from('couples')
          .select('partner_two')
          .eq('id', couple.id)
          .single();

        if (coupleData?.partner_two) {
          // Transfer ownership to partner_two
          await supabaseAdmin
            .from('couples')
            .update({ partner_one: coupleData.partner_two, partner_two: null })
            .eq('id', couple.id);
        } else {
          // No partner_two, delete the couple and related data
          // Delete weekly_cycles
          await supabaseAdmin
            .from('weekly_cycles')
            .delete()
            .eq('couple_id', couple.id);
          
          // Delete ritual_memories
          await supabaseAdmin
            .from('ritual_memories')
            .delete()
            .eq('couple_id', couple.id);
          
          // Delete ritual_feedback
          await supabaseAdmin
            .from('ritual_feedback')
            .delete()
            .eq('couple_id', couple.id);
          
          // Delete ritual_streaks
          await supabaseAdmin
            .from('ritual_streaks')
            .delete()
            .eq('couple_id', couple.id);
          
          // Delete bucket_list_items
          await supabaseAdmin
            .from('bucket_list_items')
            .delete()
            .eq('couple_id', couple.id);
          
          // Delete the couple
          await supabaseAdmin
            .from('couples')
            .delete()
            .eq('id', couple.id);
        }
      }
    }

    // Remove user as partner_two from any couples
    await supabaseAdmin
      .from('couples')
      .update({ partner_two: null })
      .eq('partner_two', user.id);

    // Delete user's bucket list items
    await supabaseAdmin
      .from('bucket_list_items')
      .delete()
      .eq('user_id', user.id);

    // Delete user's ritual preferences
    await supabaseAdmin
      .from('ritual_preferences')
      .delete()
      .eq('user_id', user.id);

    // Delete user's profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      throw new Error('Failed to delete auth user');
    }

    console.log(`Successfully deleted user: ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
