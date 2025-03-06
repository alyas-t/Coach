
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

  // Get the check-in type from the request
  const { type = 'morning', userId } = await req.json();
  
  try {
    if (userId) {
      // If a specific user ID is provided, only process for that user
      await processCheckInForUser(userId, type);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Processed ${type} check-in for user ${userId}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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

      try {
        await processCheckInForUser(userId, type);
        processedUsers.push({
          userId,
          email: userEmail,
          result: `${type.charAt(0).toUpperCase() + type.slice(1)} check-in created`
        });
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        processedUsers.push({
          userId,
          email: userEmail,
          result: `Error: ${error.message}`
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${type} check-ins for ${processedUsers.length} users`,
      details: processedUsers
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error processing ${type} check-ins:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processCheckInForUser(userId: string, type: 'morning' | 'evening') {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if user already has this type of check-in today
  const { data: existingCheckIns, error: checkInsError } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .eq('check_in_type', type);

  if (checkInsError) {
    throw checkInsError;
  }

  // If user doesn't have this type of check-in today, create one
  if (existingCheckIns.length === 0) {
    // Get user's goals to personalize the check-in
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (goalsError) {
      throw goalsError;
    }

    // Create a question based on check-in type and user goals
    let question = '';
    
    if (type === 'morning') {
      if (goals.length > 0) {
        const goalTitles = goals.slice(0, 3).map((g: any) => g.title).join(', ');
        question = `Good morning! Today's focus areas: ${goalTitles}. How do you plan to make progress on these goals today?`;
      } else {
        question = "Good morning! What are your main priorities for today?";
      }
    } else { // evening check-in
      if (goals.length > 0) {
        question = "Evening reflection: How did you progress on your goals today? What went well and what challenges did you face?";
      } else {
        question = "Evening reflection: How was your day? What wins did you have, and what could have gone better?";
      }
    }
    
    // Create the check-in
    const { error: insertError } = await supabase
      .from('check_ins')
      .insert({
        user_id: userId,
        question,
        check_in_date: today,
        check_in_type: type,
        completed: false
      });

    if (insertError) {
      throw insertError;
    }

    // In a real app, you would send an email here
    console.log(`Would send ${type} check-in email to user ${userId}`);
  } else {
    console.log(`User ${userId} already has a ${type} check-in for today`);
  }
}
