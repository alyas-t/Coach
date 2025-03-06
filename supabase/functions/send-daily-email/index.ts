
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get all users with their profiles
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('*, users:id(email)');

    if (usersError) {
      throw usersError;
    }

    // Get today's goals and check-ins
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const processedUsers = [];

    // Process each user
    for (const userProfile of usersData) {
      const userId = userProfile.id;
      const userEmail = userProfile.users?.email;
      const userName = userProfile.name || "there";

      // Skip if no email
      if (!userEmail) continue;

      // Get user's pending goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      if (goalsError) {
        console.error(`Error fetching goals for user ${userId}:`, goalsError);
        continue;
      }

      // Check if user already has a check-in today
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('check_in_date', today);

      if (checkInsError) {
        console.error(`Error fetching check-ins for user ${userId}:`, checkInsError);
        continue;
      }

      // If user doesn't have a check-in today, create one
      if (checkIns.length === 0) {
        // Create a check-in with a personalized question
        const question = "How are you feeling about your goals today?";
        
        const { error: insertError } = await supabase
          .from('check_ins')
          .insert({
            user_id: userId,
            question,
            check_in_date: today,
            completed: false
          });

        if (insertError) {
          console.error(`Error creating check-in for user ${userId}:`, insertError);
          continue;
        }

        // Send email to user
        // In a real app, you would use an email service like Resend here
        console.log(`Would send email to ${userEmail} with subject "Daily Check-in"`);
        console.log(`Email content: Hello ${userName}, it's time for your daily check-in!`);
        
        processedUsers.push({
          userId,
          email: userEmail,
          result: "Check-in created and email would be sent"
        });
      } else {
        console.log(`User ${userId} already has a check-in for today`);
        processedUsers.push({
          userId,
          email: userEmail,
          result: "Check-in already exists"
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${processedUsers.length} users`,
      details: processedUsers
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error processing daily emails:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
