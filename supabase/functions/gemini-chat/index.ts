
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
    
    // Add user name if available
    if (userProfile.name) {
      systemPrompt += ` Your user's name is ${userProfile.name}.`;
    }
    
    // Add coaching style if available
    if (userProfile.coach_style) {
      switch(userProfile.coach_style) {
        case 'supportive':
          systemPrompt += " Your coaching style is supportive. Focus on encouragement, positive reinforcement, and emotional support.";
          break;
        case 'directive':
          systemPrompt += " Your coaching style is directive. Provide clear instructions, detailed guidance, and specific action steps.";
          break;
        case 'challenging':
          systemPrompt += " Your coaching style is challenging. Push the user to step outside their comfort zone, set ambitious goals, and overcome obstacles.";
          break;
        default:
          systemPrompt += ` Your style is ${userProfile.coach_style}.`;
      }
    }
    
    // Add communication tone if available
    if (userProfile.coach_tone) {
      switch(userProfile.coach_tone) {
        case 'friendly':
          systemPrompt += " Your tone is friendly and conversational. Use casual language, show warmth, and be approachable.";
          break;
        case 'professional':
          systemPrompt += " Your tone is professional. Be straightforward, focused on results, and maintain a certain formality.";
          break;
        case 'motivational':
          systemPrompt += " Your tone is motivational. Be energetic, inspiring, and use language that drives action.";
          break;
        default:
          systemPrompt += ` Your tone is ${userProfile.coach_tone}.`;
      }
    }
    
    // Add focus areas if available
    if (userProfile.focus_areas && userProfile.focus_areas.length > 0) {
      systemPrompt += ` The user is focused on: ${userProfile.focus_areas.join(', ')}.`;
    }
    
    // Include advice on addressing user by name
    systemPrompt += " Address the user by their name occasionally to create a more personal connection.";

    // Prepare messages for the API
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...history.map((msg: any) => ({
        role: msg.sender === "coach" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    console.log("Sending request to Gemini API with system prompt:", systemPrompt);
    
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
