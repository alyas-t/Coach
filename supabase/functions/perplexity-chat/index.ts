
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// We need to add the Perplexity API key to Supabase secrets
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const API_URL = "https://api.perplexity.ai/chat/completions";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Perplexity chat function received a request");
    
    // Verify API key is present
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY environment variable is not set");
      throw new Error("PERPLEXITY_API_KEY environment variable is not set");
    }
    
    // Parse request
    const { message, history, userContext } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }
    
    // Create detailed system prompt based on user profile
    let systemPrompt = "You are a personal coach and assistant who helps users with their goals, motivation, and well-being.";
    
    // Add user profile context if available
    if (userContext?.profile) {
      const userProfile = userContext.profile;
      
      // Add user name if available
      if (userProfile.name) {
        systemPrompt += ` Your user's name is ${userProfile.name}. Address them by name occasionally.`;
      }
      
      // Add user age if available for age-appropriate advice
      if (userProfile.age) {
        systemPrompt += ` Your user is ${userProfile.age} years old.`;
      }
      
      // Add coaching style
      if (userProfile.coach_style) {
        systemPrompt += ` Your coaching style is ${userProfile.coach_style}.`;
      }
      
      // Add coaching tone
      if (userProfile.coach_tone) {
        systemPrompt += ` Your tone is ${userProfile.coach_tone}.`;
      }
      
      // Add focus areas
      if (userProfile.focus_areas && userProfile.focus_areas.length > 0) {
        systemPrompt += ` The user is focused on: ${userProfile.focus_areas.join(', ')}.`;
      }
    }
    
    systemPrompt += " Keep your responses concise and actionable - typically 2-3 paragraphs.";
    
    console.log("Using system prompt:", systemPrompt.substring(0, 200) + "...");
    
    // Prepare messages for the API
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add conversation history if available
    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        messages.push({
          role: msg.sender === "coach" ? "assistant" : "user",
          content: msg.content
        });
      });
    }
    
    // Add current message
    messages.push({ role: "user", content: message });

    console.log("Sending request to Perplexity API");
    
    // Call Perplexity API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Perplexity API error:", errorData);
      throw new Error(`Perplexity API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Perplexity API response received");
    
    const generatedText = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    
    return new Response(
      JSON.stringify({ response: generatedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing chat request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
