
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    console.log("Starting text-to-speech request processing");
    
    // Parse request body
    let reqBody;
    try {
      reqBody = await req.json();
      console.log("Request body parsed successfully:", JSON.stringify(reqBody).substring(0, 100));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body format" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { text, voice } = reqBody;
    
    if (!text) {
      console.error("Missing required parameter: text");
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log("Processing TTS request for text:", text.substring(0, 50) + "...");
    console.log("Using voice:", voice || "default");
    
    // Use ElevenLabs TTS API with the provided API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      console.error("Missing environment variable: ELEVENLABS_API_KEY");
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Voice ID mapping - default to "Rachel" voice if not specified
    // Rachel is a female voice with a neutral accent (Voice ID: 21m00Tcm4TlvDq8ikWAM)
    const voiceId = voice || "21m00Tcm4TlvDq8ikWAM";
    
    console.log("Making ElevenLabs API request with voice ID:", voiceId);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        }),
      });
      
      if (!response.ok) {
        console.error("ElevenLabs API error:", response.status, response.statusText);
        let errorDetails = "Unknown error";
        try {
          errorDetails = await response.text();
          console.error("Error details:", errorDetails);
        } catch (e) {
          console.error("Could not read error details");
        }
        
        return new Response(
          JSON.stringify({ 
            error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
            details: errorDetails
          }),
          { 
            status: 502, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log("Successfully received audio response from ElevenLabs");
      
      // Get audio data as arrayBuffer and convert to base64
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log("Audio data size (bytes):", uint8Array.length);
      
      // Convert to base64 in chunks to avoid memory issues
      let base64Audio = "";
      const chunkSize = 10000;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64Audio += btoa(String.fromCharCode(...chunk));
      }
      
      console.log("Successfully converted audio to base64, size:", base64Audio.length);
      
      return new Response(
        JSON.stringify({ audio: base64Audio }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (fetchError) {
      console.error("Error making request to ElevenLabs API:", fetchError);
      return new Response(
        JSON.stringify({ error: `Error calling ElevenLabs API: ${fetchError.message}` }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Text-to-speech error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
