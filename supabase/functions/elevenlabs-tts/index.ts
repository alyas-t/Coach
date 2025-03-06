
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ElevenLabs TTS API service configuration
 */
const CONFIG = {
  API_KEY: Deno.env.get("ELEVENLABS_API_KEY"),
  BASE_URL: "https://api.elevenlabs.io/v1/text-to-speech",
  DEFAULT_VOICE_ID: "21m00Tcm4TlvDq8ikWAM", // Default: Rachel
  DEFAULT_MODEL: "eleven_turbo_v2",
  RETRY: {
    MAX_ATTEMPTS: 2,
    INITIAL_DELAY_MS: 1000,
  },
};

/**
 * CORS headers for the response
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Voice settings for the TTS request
 */
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
};

/**
 * Handles CORS preflight requests
 * @param {Request} request - The incoming request
 * @returns {Response} CORS preflight response
 */
function handleCorsPreflightRequest() {
  return new Response(null, { headers: CORS_HEADERS });
}

/**
 * Validates the TTS request parameters
 * @param {object} requestData - The parsed request data
 * @throws {Error} If validation fails
 */
function validateRequest(requestData) {
  if (!CONFIG.API_KEY) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }
  
  if (!requestData.text) {
    throw new Error("Text content is required");
  }
}

/**
 * Prepares the TTS request payload
 * @param {object} requestData - The parsed request data
 * @returns {object} The prepared request payload
 */
function prepareRequestPayload(requestData) {
  const { text, voiceId = CONFIG.DEFAULT_VOICE_ID, model = CONFIG.DEFAULT_MODEL } = requestData;
  
  return {
    url: `${CONFIG.BASE_URL}/${voiceId}`,
    options: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": CONFIG.API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: model,
        voice_settings: DEFAULT_VOICE_SETTINGS
      }),
    }
  };
}

/**
 * Makes a request to the ElevenLabs API with retry logic
 * @param {string} url - The API endpoint URL
 * @param {object} options - The fetch options
 * @returns {Promise<Response>} The API response
 * @throws {Error} If all retry attempts fail
 */
async function makeRequestWithRetry(url, options) {
  let response;
  let retries = 0;
  
  while (retries <= CONFIG.RETRY.MAX_ATTEMPTS) {
    try {
      response = await fetch(url, options);
      
      // If response is OK, return it
      if (response.ok) return response;
      
      // If we got rate limited, wait and retry
      if (response.status === 429) {
        const waitTime = (retries + 1) * CONFIG.RETRY.INITIAL_DELAY_MS;
        console.log(`Rate limited, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      // For other errors, throw to be caught by outer catch
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    } catch (error) {
      if (retries >= CONFIG.RETRY.MAX_ATTEMPTS) throw error;
      console.error(`Attempt ${retries + 1} failed:`, error);
      retries++;
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.INITIAL_DELAY_MS));
    }
  }
  
  throw new Error("All retry attempts failed");
}

/**
 * Converts an ArrayBuffer to a Base64 string
 * @param {ArrayBuffer} buffer - The array buffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Creates a success response
 * @param {object} data - The response data
 * @returns {Response} The success response
 */
function createSuccessResponse(data) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...CORS_HEADERS, 
        "Content-Type": "application/json" 
      } 
    }
  );
}

/**
 * Creates an error response
 * @param {Error} error - The error object
 * @returns {Response} The error response
 */
function createErrorResponse(error) {
  return new Response(
    JSON.stringify({ 
      error: error.message,
      success: false 
    }),
    {
      status: 200, // Return 200 even on error so UI can handle it gracefully
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
}

/**
 * Main handler for the ElevenLabs TTS service
 * @param {Request} req - The incoming request
 * @returns {Promise<Response>} The response
 */
async function handleTTSRequest(req) {
  try {
    console.log("ElevenLabs TTS function received a request");
    
    // Parse request
    const requestData = await req.json();
    
    // Validate request
    validateRequest(requestData);
    
    const { text, voiceId = CONFIG.DEFAULT_VOICE_ID } = requestData;
    console.log(`Generating speech for text: "${text.substring(0, 50)}..." using voice: ${voiceId}`);
    
    // Prepare the request payload
    const { url, options } = prepareRequestPayload(requestData);
    
    // Make the request to ElevenLabs API
    const response = await makeRequestWithRetry(url, options);
    
    // Get audio data as arrayBuffer
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Convert to base64 for easy transmission
    const base64Audio = arrayBufferToBase64(audioArrayBuffer);
    
    console.log("Successfully generated audio");
    
    return createSuccessResponse({ audioContent: base64Audio });
  } catch (error) {
    console.error("Error processing TTS request:", error);
    return createErrorResponse(error);
  }
}

// Register the request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  return handleTTSRequest(req);
});
