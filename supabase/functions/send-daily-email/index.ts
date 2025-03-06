
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = "morning" } = await req.json();
    const checkInType = type === "evening" ? "evening" : "morning";
    
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

      // Create a personalized question based on type
      const question = checkInType === "evening"
        ? "How did you do with your goals today? What went well, and what could have gone better?"
        : "How are you feeling about your goals today?";
      
      // Check if user already has a check-in of this type today
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

      // If user doesn't have a check-in of this type today, create one
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
          console.error(`Error creating ${checkInType} check-in for user ${userId}:`, insertError);
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
        const emailSubject = checkInType === "evening" 
          ? `Evening Reflection Time, ${userName}` 
          : `Good Morning ${userName}, Time to Plan Your Day`;
        
        const emailContent = checkInType === "evening"
          ? `Hello ${userName},\n\nIt's time for your evening check-in! Take a moment to reflect on your day and your progress with your goals.${goalsSummary}\n\nHow did you do with your goals today? What went well, and what could have gone better?\n\nChecking in regularly helps you stay on track and achieve your goals faster.\n\nBest regards,\nYour Goal Coach`
          : `Hello ${userName},\n\nGood morning! It's time to set your intentions for the day and focus on your goals.${goalsSummary}\n\nHow are you feeling about your goals today? What steps will you take to make progress?\n\nHave a productive day!\n\nBest regards,\nYour Goal Coach`;
        
        try {
          // Send an actual email using Resend
          const emailResponse = await resend.emails.send({
            from: "Goal Coach <onboarding@resend.dev>",
            to: userEmail,
            subject: emailSubject,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px;">
              <h2 style="color: #4f46e5;">${emailSubject}</h2>
              <p>Hello ${userName},</p>
              ${checkInType === "evening" 
                ? `<p>It's time for your evening check-in! Take a moment to reflect on your day and your progress with your goals.</p>` 
                : `<p>Good morning! It's time to set your intentions for the day and focus on your goals.</p>`
              }
              ${goals && goals.length > 0 
                ? `<div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #4f46e5;">Your current goals:</h3>
                    <ul style="padding-left: 20px;">
                      ${goals.map((goal, index) => {
                        const progress = Math.round((goal.progress || 0) * 100);
                        return `<li style="margin-bottom: 8px;">
                          <strong>${goal.title}</strong> - ${progress}% complete
                          ${goal.streak && goal.streak > 0 
                            ? `<span style="color: #4f46e5; font-weight: bold;">(${goal.streak} day streak!)</span>` 
                            : ''}
                        </li>`;
                      }).join('')}
                    </ul>
                  </div>` 
                : ''
              }
              <p style="font-weight: bold; color: #4f46e5;">
                ${checkInType === "evening"
                  ? "How did you do with your goals today? What went well, and what could have gone better?"
                  : "How are you feeling about your goals today? What steps will you take to make progress?"
                }
              </p>
              <p>
                ${checkInType === "evening"
                  ? "Checking in regularly helps you stay on track and achieve your goals faster."
                  : "Have a productive day!"
                }
              </p>
              <p>Best regards,<br>Your Goal Coach</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666;">
                <p>This is an automated message from your Goal Coach application.</p>
              </div>
            </div>`
          });
          
          console.log(`Email sent to ${userEmail} for ${checkInType} check-in:`, emailResponse);
          
        } catch (emailError) {
          console.error(`Error sending email to ${userEmail}:`, emailError);
        }
        
        processedUsers.push({
          userId,
          email: userEmail,
          result: `${checkInType} check-in created and email sent`,
          goalsCount: goals ? goals.length : 0
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
      message: `Processed ${processedUsers.length} users for ${checkInType} check-ins`,
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
