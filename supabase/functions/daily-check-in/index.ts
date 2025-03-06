
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

      // Get user's goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      if (goalsError) {
        console.error(`Error fetching goals for user ${userId}:`, goalsError);
        continue;
      }

      // Create a question based on the check-in type
      const question = isEvening 
        ? "How did you do with your goals today? What went well, and what could have gone better?"
        : "How are you feeling about your goals today?";
        
      // Check if user already has a check-in with this question today
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .eq('question', question);

      if (checkInsError) {
        console.error(`Error fetching check-ins for user ${userId}:`, checkInsError);
        continue;
      }

      // If user doesn't have a check-in with this question today, create one
      if (checkIns.length === 0) {
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

        // Prepare goals summary for email
        let goalsSummary = "";
        if (goals && goals.length > 0) {
          goalsSummary = "\n\nYour current goals:\n";
          goals.forEach((goal, index) => {
            const progress = Math.round((goal.progress || 0) * 100);
            goalsSummary += `${index + 1}. ${goal.title} - ${progress}% complete`;
            if (goal.streak && goal.streak > 0) {
              goalsSummary += ` (${goal.streak} day streak!)`;
            }
            goalsSummary += "\n";
          });
        }

        // Create email content with personalization and goals
        const emailSubject = isEvening 
          ? `Evening Reflection Time, ${userName}` 
          : `Good Morning ${userName}, Time to Plan Your Day`;
        
        const emailContent = isEvening
          ? `Hello ${userName},\n\nIt's time for your evening check-in! Take a moment to reflect on your day and your progress with your goals.${goalsSummary}\n\nHow did you do with your goals today? What went well, and what could have gone better?\n\nChecking in regularly helps you stay on track and achieve your goals faster.\n\nBest regards,\nYour Goal Coach`
          : `Hello ${userName},\n\nGood morning! It's time to set your intentions for the day and focus on your goals.${goalsSummary}\n\nHow are you feeling about your goals today? What steps will you take to make progress?\n\nHave a productive day!\n\nBest regards,\nYour Goal Coach`;
        
        // Log email details (in a real app, you would send an actual email here)
        console.log(`Would send ${isEvening ? 'evening' : 'morning'} check-in email to ${userEmail}`);
        console.log(`Email subject: ${emailSubject}`);
        console.log(`Email content: ${emailContent}`);
        
        processedUsers.push({
          userId,
          email: userEmail,
          result: `${isEvening ? 'Evening' : 'Morning'} check-in created and email would be sent`,
          goalsCount: goals ? goals.length : 0
        });
      } else {
        console.log(`User ${userId} already has a check-in for today with question: "${question}"`);
        processedUsers.push({
          userId,
          email: userEmail,
          result: `Check-in already exists`
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      checkInType: isEvening ? 'evening' : 'morning',
      message: `Processed ${processedUsers.length} users for ${isEvening ? 'evening' : 'morning'} check-ins`,
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
