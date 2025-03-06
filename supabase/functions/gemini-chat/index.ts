
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = "gemini-1.5-pro";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// CORS headers for the response
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
    const { message, userContext } = await req.json();
    console.log("Received request:", { message, userContext });
    
    // Prepare history from context if available
    const history = userContext?.messages || [];
    const userProfile = userContext?.profile || {};
    
    // Create system prompt based on user profile
    let systemPrompt = "You are a personal coach and assistant who helps users with their goals, motivation, and well-being.";
    
    // Add coaching style if available
    if (userProfile.coach_style || userProfile.coach_tone) {
      systemPrompt += ` Your style is ${userProfile.coach_style || 'supportive'} and your tone is ${userProfile.coach_tone || 'friendly'}.`;
    }
    
    // Add focus areas if available
    if (userProfile.focus_areas && userProfile.focus_areas.length > 0) {
      systemPrompt += ` The user is focused on: ${userProfile.focus_areas.join(', ')}.`;
    }

    // Prepare messages for the API
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...history.map((msg: any) => ({
        role: msg.sender === "coach" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    console.log("Sending request to Gemini API");
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const data = await response.json();
    console.log("Gemini API response:", data);
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Error calling Gemini API");
    }

    const generatedText = data.candidates[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
    
    return new Response(JSON.stringify({ response: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
