
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
    const { type = "morning" } = await req.json();
    const isEvening = type === "evening";
    const checkInType = isEvening ? "evening" : "morning";

    // Get all users with their profiles
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('*, users:id(email)');

    if (usersError) {
      throw usersError;
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const processedUsers = [];

    // Process each user
    for (const userProfile of usersData) {
      const userId = userProfile.id;
      const userEmail = userProfile.users?.email;
      const userName = userProfile.name || "there";

      // Skip if no email
      if (!userEmail) continue;

      // Check if user already has a check-in of this type today
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .eq('check_in_type', checkInType);

      if (checkInsError) {
        console.error(`Error fetching check-ins for user ${userId}:`, checkInsError);
        continue;
      }

      // If user doesn't have a check-in of this type today, create one
      if (checkIns.length === 0) {
        // Create a question based on the check-in type
        const question = isEvening 
          ? "How did you do with your goals today? What went well, and what could have gone better?"
          : "How are you feeling about your goals today?";
        
        const { error: insertError } = await supabase
          .from('check_ins')
          .insert({
            user_id: userId,
            question,
            check_in_date: today,
            check_in_type: checkInType,
            completed: false
          });

        if (insertError) {
          console.error(`Error creating ${checkInType} check-in for user ${userId}:`, insertError);
          continue;
        }

        // Send email to user (in a real app, you would use an email service here)
        console.log(`Would send ${checkInType} check-in email to ${userEmail}`);
        console.log(`Email content: Hello ${userName}, it's time for your ${checkInType} check-in!`);
        
        processedUsers.push({
          userId,
          email: userEmail,
          result: `${checkInType} check-in created and email would be sent`
        });
      } else {
        console.log(`User ${userId} already has a ${checkInType} check-in for today`);
        processedUsers.push({
          userId,
          email: userEmail,
          result: `${checkInType} check-in already exists`
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      checkInType,
      message: `Processed ${processedUsers.length} users for ${checkInType} check-ins`,
      details: processedUsers
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error processing ${req.method} request:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
