import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (level: string, message: string, data?: Record<string, unknown>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    function: 'parse-bucket-list',
    message,
    ...data,
  }));
};

serve(async (req) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('info', 'Function invoked', { requestId });

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      log('error', 'GOOGLE_AI_API_KEY not configured', { requestId });
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

    const { imageData } = await req.json();
    
    if (!imageData) {
      log('warn', 'No image data provided', { requestId });
      throw new Error('No image data provided');
    }

    // Validate image format
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      log('warn', 'Invalid image format', { requestId });
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Must be a data URL starting with data:image/' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (max 10MB in base64 ≈ 15MB string)
    const MAX_IMAGE_SIZE = 15_000_000;
    if (imageData.length > MAX_IMAGE_SIZE) {
      log('warn', 'Image too large', { requestId, size: imageData.length });
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'Processing bucket list image', { requestId, imageDataLength: imageData.length });

    // Extract base64 data and mime type from data URL
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      log('warn', 'Invalid data URL format', { requestId });
      return new Response(
        JSON.stringify({ error: 'Invalid data URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    // Use Google Gemini API directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are extracting bucket list items from an image. 
                
Look at this image and extract all bucket list items, goals, or wishlist items you can see.

Rules:
1. Extract each item as a separate entry
2. Clean up the text (fix typos, remove bullet points/numbers)
3. Keep items concise (under 100 characters)
4. Ignore decorative text, headers, or non-list content
5. If you can't read something clearly, skip it

Return ONLY a JSON array of strings, nothing else:
["item 1", "item 2", "item 3"]

If you cannot find any list items, return an empty array: []`
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        log('warn', 'Rate limit exceeded', { requestId });
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      log('error', 'AI API error', { requestId, status: response.status, error: errorText });
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response format
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up the response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let items: string[] = [];
    try {
      items = JSON.parse(content);
      // Validate it's an array of strings
      if (!Array.isArray(items)) {
        items = [];
      }
      items = items.filter(item => typeof item === 'string' && item.length > 2);
    } catch (e) {
      log('warn', 'Failed to parse AI response', { requestId, content: content.substring(0, 200) });
      items = [];
    }

    const executionTime = Date.now() - startTime;
    log('info', 'Extraction completed', { requestId, itemsCount: items.length, executionTimeMs: executionTime });

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Function failed', { requestId, error: errorMessage, executionTimeMs: executionTime });
    return new Response(
      JSON.stringify({ error: errorMessage, items: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
