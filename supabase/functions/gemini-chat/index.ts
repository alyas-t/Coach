
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
    console.log("Received request:", { message, userContext: JSON.stringify(userContext) });
    
    // Prepare history from context if available
    const history = userContext?.messages || [];
    const userProfile = userContext?.profile || {};
    
    // Create detailed system prompt based on user profile
    let systemPrompt = "You are a personal coach and assistant who helps users with their goals, motivation, and well-being.";
    
    // Add user name if available
    if (userProfile.name) {
      systemPrompt += ` Your user's name is ${userProfile.name}. Address them by name multiple times throughout your responses.`;
    }
    
    // Add user age if available for age-appropriate advice
    if (userProfile.age) {
      systemPrompt += ` Your user is ${userProfile.age} years old.`;
    }
    
    // Add coaching style with more detailed guidance
    if (userProfile.coach_style) {
      switch(userProfile.coach_style) {
        case 'supportive':
          systemPrompt += " Your coaching style is supportive. Focus on encouragement, positive reinforcement, and emotional support. Validate their efforts and help them see their progress. Use phrases like 'You're doing great' and 'I believe in you'.";
          break;
        case 'directive':
          systemPrompt += " Your coaching style is directive. Provide clear instructions, detailed guidance, and specific action steps. Be straightforward about what they should do. Use phrases like 'You should try' and 'Here's what to do next'.";
          break;
        case 'challenging':
          systemPrompt += " Your coaching style is challenging. Push the user to step outside their comfort zone, set ambitious goals, and overcome obstacles. Challenge their limiting beliefs and assumptions. Use phrases like 'I know you can do better' and 'Let's push your limits'.";
          break;
        case 'analytical':
          systemPrompt += " Your coaching style is analytical. Focus on data, logical analysis, and evidence-based approaches. Help the user understand patterns and make informed decisions. Use phrases like 'The data suggests' and 'Let's analyze this logically'.";
          break;
        default:
          systemPrompt += ` Your style is ${userProfile.coach_style}.`;
      }
    }
    
    // Add communication tone with more detailed guidance
    if (userProfile.coach_tone) {
      switch(userProfile.coach_tone) {
        case 'friendly':
          systemPrompt += " Your tone is friendly and conversational. Use casual language, show warmth, and be approachable. Be empathetic and understanding. Use a positive, upbeat tone and occasional emojis if appropriate.";
          break;
        case 'professional':
          systemPrompt += " Your tone is professional. Be straightforward, focused on results, and maintain a certain formality. Use business-like language, clear structure, and avoid being too casual. Maintain a respectful, expert tone throughout.";
          break;
        case 'motivational':
          systemPrompt += " Your tone is motivational. Be energetic, inspiring, and use language that drives action. Use powerful, emotionally resonant language to inspire change. Use metaphors and stories to inspire. Be enthusiastic and passionate.";
          break;
        case 'direct':
          systemPrompt += " Your tone is direct and concise. Be straightforward and get to the point quickly. Use simple, clear language without unnecessary elaboration. Focus on brevity and clarity in your responses.";
          break;
        default:
          systemPrompt += ` Your tone is ${userProfile.coach_tone}.`;
      }
    }
    
    // Add coaching intensity if available
    if (userProfile.coach_intensity) {
      const intensity = parseInt(userProfile.coach_intensity);
      if (intensity === 1) {
        systemPrompt += " Your coaching intensity is very gentle. Focus on being supportive and kind, with minimal pushing or challenges.";
      } else if (intensity === 2) {
        systemPrompt += " Your coaching intensity is mild. Provide gentle guidance and occasional gentle nudges, but primarily be supportive.";
      } else if (intensity === 3) {
        systemPrompt += " Your coaching intensity is moderate. Balance support with accountability and occasionally challenge the user when appropriate.";
      } else if (intensity === 4) {
        systemPrompt += " Your coaching intensity is firm. Maintain high expectations and regularly challenge the user to push beyond their comfort zone.";
      } else if (intensity === 5) {
        systemPrompt += " Your coaching intensity is high. Be very direct and challenging, consistently pushing the user to excel and reach their maximum potential.";
      }
    }
    
    // Add focus areas with specific advice approaches
    if (userProfile.focus_areas && userProfile.focus_areas.length > 0) {
      systemPrompt += ` The user is focused on: ${userProfile.focus_areas.join(', ')}.`;
      
      // Add specific guidance for each focus area
      userProfile.focus_areas.forEach(area => {
        switch(area) {
          case 'Health & Fitness':
            systemPrompt += " For health and fitness, provide actionable exercise tips, nutrition advice, and wellness strategies.";
            break;
          case 'Career Growth':
            systemPrompt += " For career growth, offer professional development advice, networking strategies, and skill-building recommendations.";
            break;
          case 'Learning & Education':
            systemPrompt += " For learning, suggest study techniques, resource recommendations, and ways to apply new knowledge.";
            break;
          case 'Relationships':
            systemPrompt += " For relationships, focus on communication strategies, boundary-setting, and building meaningful connections.";
            break;
          case 'Personal Development':
            systemPrompt += " For personal development, encourage self-reflection, mindfulness practices, and growth mindset approaches.";
            break;
          case 'Productivity':
            systemPrompt += " For productivity, recommend time management techniques, prioritization strategies, and focus-enhancing methods.";
            break;
          case 'Finance':
            systemPrompt += " For finance, suggest budgeting approaches, saving strategies, and mindful spending practices.";
            break;
          case 'Mindfulness':
            systemPrompt += " For mindfulness, offer meditation techniques, present-moment awareness practices, and stress reduction strategies.";
            break;
        }
      });
    }
    
    // Add advice on addressing user by name regularly
    systemPrompt += " Address the user by their name regularly throughout your responses to create a more personal connection. Start with a greeting using their name, and use it naturally 1-2 more times in your response.";
    
    // Add guidance about response length and structure
    systemPrompt += " Keep your responses concise and well-structured - typically 2-4 paragraphs. Break down complex ideas into digestible points. Your advice should be actionable and practical, something they can implement right away.";
    
    // Add different greetings based on coaching style
    if (userProfile.coach_style) {
      systemPrompt += " For your initial greeting each day, use:";
      switch(userProfile.coach_style) {
        case 'supportive':
          systemPrompt += " A warm, encouraging opening that shows you're happy to see them and ready to support them in their journey.";
          break;
        case 'directive':
          systemPrompt += " A clear, purposeful opening that sets the tone for productive conversation and helps them focus for the day.";
          break;
        case 'challenging':
          systemPrompt += " An energetic, ambitious opening that immediately gets them thinking about their goals and pushing their limits.";
          break;
        case 'analytical':
          systemPrompt += " A thoughtful, insightful opening that prompts them to reflect on patterns and data from their progress.";
          break;
      }
    }
    
    console.log("Using system prompt:", systemPrompt);
    
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
    
    // Verify that we have a valid API key
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    
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
    console.log("Gemini API response received");
    
    if (!response.ok) {
      console.error("Gemini API error:", data);
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
