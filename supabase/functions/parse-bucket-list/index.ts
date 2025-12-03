import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { imageData } = await req.json();
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    console.log('Processing bucket list image...');

    // Use Gemini's vision capability to extract text
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
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
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
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
      console.error('Failed to parse AI response:', content);
      items = [];
    }

    console.log(`Extracted ${items.length} bucket list items`);

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-bucket-list:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', items: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
