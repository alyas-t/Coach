
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
    const { text, voice } = await req.json()
    
    if (!text) {
      throw new Error('Text is required')
    }
    
    console.log("Processing TTS request for text:", text.substring(0, 50) + "...");
    console.log("Using voice:", voice || "default");
    
    // Use ElevenLabs TTS API with the provided API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }
    
    // Voice ID mapping - default to "Rachel" voice if not specified
    // Rachel is a female voice with a neutral accent (Voice ID: 21m00Tcm4TlvDq8ikWAM)
    const voiceId = voice || "21m00Tcm4TlvDq8ikWAM";
    
    console.log("Making ElevenLabs API request with voice ID:", voiceId);
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
      const errorText = await response.text();
      console.error("Error details:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }
    
    console.log("Successfully received audio response from ElevenLabs");
    
    // Get audio data as arrayBuffer and convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return new Response(
      JSON.stringify({ audio: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Text-to-speech error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
