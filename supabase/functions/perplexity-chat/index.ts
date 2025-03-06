
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration for the API
const CONFIG = {
  API_KEY: Deno.env.get("PERPLEXITY_API_KEY"),
  API_URL: "https://api.perplexity.ai/chat/completions",
  MODEL: "llama-3.1-sonar-small-128k-online",
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
  },
  PARAMS: {
    temperature: 0.7,
    max_tokens: 500,
    top_p: 0.9,
    frequency_penalty: 0.5,
    presence_penalty: 0.5
  }
};

/**
 * Handles CORS preflight requests
 * @returns {Response} CORS preflight response
 */
function handleCorsPreflightRequest() {
  return new Response(null, { 
    headers: corsHeaders,
    status: 204
  });
}

/**
 * Validate the request parameters
 * @param {any} requestData - The request data
 * @throws {Error} If validation fails
 */
function validateRequest(requestData: any) {
  if (!CONFIG.API_KEY) {
    throw new Error("PERPLEXITY_API_KEY environment variable is not set");
  }
  
  if (!requestData || !requestData.message) {
    throw new Error("Message is required in the request");
  }
}

/**
 * Creates a structured system prompt based on user profile
 * @param {any} userContext - User profile information
 * @returns {string} The formatted system prompt
 */
function createSystemPrompt(userContext: any): string {
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
  
  return systemPrompt;
}

/**
 * Prepares the messages array for the API
 * @param {string} systemPrompt - The system prompt
 * @param {any[]} history - Chat history
 * @param {string} message - Current user message
 * @returns {any[]} The messages array for the API
 */
function prepareMessages(systemPrompt: string, history: any[], message: string): any[] {
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
  
  return messages;
}

/**
 * Makes a request to the Perplexity API with retry logic
 * @param {any[]} messages - The messages to send
 * @returns {Promise<Response>} The API response
 * @throws {Error} If all retry attempts fail
 */
async function makeRequestWithRetry(messages: any[]): Promise<Response> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries <= CONFIG.RETRY.MAX_ATTEMPTS) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CONFIG.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: messages,
          temperature: CONFIG.PARAMS.temperature,
          max_tokens: CONFIG.PARAMS.max_tokens,
          top_p: CONFIG.PARAMS.top_p,
          frequency_penalty: CONFIG.PARAMS.frequency_penalty,
          presence_penalty: CONFIG.PARAMS.presence_penalty
        }),
      });
      
      // If response is OK, return it
      if (response.ok) return response;
      
      // If we got rate limited, wait and retry
      if (response.status === 429) {
        const waitTime = (retries + 1) * CONFIG.RETRY.INITIAL_DELAY_MS;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      // For other errors, throw to be caught by outer catch
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    } catch (error: any) {
      lastError = error;
      
      if (retries >= CONFIG.RETRY.MAX_ATTEMPTS) break;
      
      const backoffTime = CONFIG.RETRY.INITIAL_DELAY_MS * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      retries++;
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
}

/**
 * Process the API response
 * @param {Response} response - The API response
 * @returns {Promise<string>} The generated text
 * @throws {Error} If the response is invalid
 */
async function processResponse(response: Response): Promise<string> {
  const data = await response.json();
  
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error("Invalid response format from Perplexity API");
  }
  
  return data.choices[0].message.content;
}

/**
 * Creates a success response
 * @param {string} generatedText - The generated text
 * @returns {Response} The success response
 */
function createSuccessResponse(generatedText: string): Response {
  return new Response(
    JSON.stringify({ response: generatedText }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    }
  );
}

/**
 * Creates an error response
 * @param {Error} error - The error object
 * @returns {Response} The error response
 */
function createErrorResponse(error: Error): Response {
  return new Response(
    JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
    }),
    {
      status: 200, // Return 200 even on error so the UI can display the fallback message
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Main handler for the Perplexity chat service
 * @param {Request} req - The incoming request
 * @returns {Promise<Response>} The response
 */
async function handleChatRequest(req: Request): Promise<Response> {
  try {
    // Parse request
    const requestData = await req.json();
    
    // Validate request
    validateRequest(requestData);
    
    const { message, history, userContext } = requestData;
    
    // Create system prompt
    const systemPrompt = createSystemPrompt(userContext);
    
    // Prepare messages
    const messages = prepareMessages(systemPrompt, history, message);
    
    // Make the request to Perplexity API
    const response = await makeRequestWithRetry(messages);
    
    // Process the response
    const generatedText = await processResponse(response);
    
    // Return the response
    return createSuccessResponse(generatedText);
  } catch (error: any) {
    return createErrorResponse(error);
  }
}

// Register the request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  return handleChatRequest(req);
});
