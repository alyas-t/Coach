
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

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
    console.log("ElevenLabs TTS function received a request");
    
    // Verify API key is present
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY environment variable is not set");
      throw new Error("ELEVENLABS_API_KEY environment variable is not set");
    }
    
    // Parse request
    const { text, voiceId, model } = await req.json();
    
    if (!text) {
      throw new Error("Text content is required");
    }
    
    // Default voice ID if not provided
    const voice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
    // Default model if not provided
    const ttsModel = model || "eleven_turbo_v2";

    console.log(`Generating speech for text: "${text.substring(0, 50)}..." using voice: ${voice}`);
    
    // Call ElevenLabs API with retry logic
    let response;
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        response = await fetch(`${API_URL}/${voice}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: ttsModel,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          }),
        });
        
        // If response is OK, break from retry loop
        if (response.ok) break;
        
        // If we got rate limited, wait and retry
        if (response.status === 429) {
          const waitTime = (retries + 1) * 1000; // Exponential backoff
          console.log(`Rate limited, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }
        
        // For other errors, throw to be caught by outer catch
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      } catch (error) {
        if (retries >= maxRetries) throw error;
        console.error(`Attempt ${retries + 1} failed:`, error);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response || !response.ok) {
      const errorData = await response.text();
      console.error("ElevenLabs API error:", errorData);
      throw new Error(`ElevenLabs API error: ${response?.status || 'Unknown'} - ${errorData || 'Unknown error'}`);
    }

    // Get audio data as arrayBuffer
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Convert to base64 for easy transmission
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioArrayBuffer))
    );
    
    console.log("Successfully generated audio");
    
    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
    
  } catch (error) {
    console.error("Error processing TTS request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 200, // Return 200 even on error so UI can handle it gracefully
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
