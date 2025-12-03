import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Location context utilities
type City = 'London' | 'Sydney' | 'Melbourne' | 'New York';

const CITY_DATA: Record<City, { timezone: string; country: string; emoji: string }> = {
  'London': { timezone: 'Europe/London', country: 'United Kingdom', emoji: '🇬🇧' },
  'Sydney': { timezone: 'Australia/Sydney', country: 'Australia', emoji: '🦘' },
  'Melbourne': { timezone: 'Australia/Melbourne', country: 'Australia', emoji: '☕' },
  'New York': { timezone: 'America/New_York', country: 'United States', emoji: '🗽' },
};

const getCityTime = (city: City): Date => {
  const timezone = CITY_DATA[city].timezone;
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: timezone }));
};

const getTimeOfDay = (city: City): string => {
  const hour = getCityTime(city).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

const getSeason = (city: City): string => {
  const now = getCityTime(city);
  const month = now.getMonth();
  const isSouthern = city === 'Sydney' || city === 'Melbourne';
  
  if (isSouthern) {
    if (month >= 9 && month <= 11) return 'spring';
    if (month >= 0 && month <= 2) return 'summer';
    if (month >= 3 && month <= 5) return 'autumn';
    return 'winter';
  }
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

const getSeasonalGuidance = (season: string, city: City): string => {
  const seasonal = {
    spring: 'Outdoor activities emerging, mild weather, blooming nature',
    summer: 'Peak outdoor season, long daylight, beach/park activities',
    autumn: 'Cozy indoor-outdoor mix, changing foliage, harvest themes',
    winter: 'Indoor-focused with occasional outdoor adventures, warm experiences',
  };
  
  if (city === 'Sydney' || city === 'Melbourne') {
    return seasonal[season as keyof typeof seasonal] + ' (Southern Hemisphere)';
  }
  return seasonal[season as keyof typeof seasonal];
};

const getLocationContext = (city: City) => {
  const season = getSeason(city);
  const timeOfDay = getTimeOfDay(city);
  const cityData = CITY_DATA[city];
  const localTime = getCityTime(city).toLocaleString('en-US', {
    timeZone: cityData.timezone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  
  return {
    city,
    timezone: cityData.timezone,
    country: cityData.country,
    season,
    timeOfDay,
    localTime,
  };
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

    // Initialize Supabase client for historical data
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, currentRitual, coupleId, partnerOneInput, partnerTwoInput, userCity } = await req.json();

    // Get location context - use userCity parameter that's actually sent from the client
    const preferredCity = (userCity || 'New York') as City;
    const locationContext = getLocationContext(preferredCity);
    
    console.log('Location context:', locationContext);

    // Fetch historical data for context
    let historicalContext = '';
    if (coupleId) {
      // Get all weekly cycles for this couple
      const { data: cycles } = await supabaseClient
        .from('weekly_cycles')
        .select('id')
        .eq('couple_id', coupleId);

      const cycleIds = cycles?.map(c => c.id) || [];

      // Get completed rituals
      const { data: completions } = await supabaseClient
        .from('completions')
        .select('ritual_title, completed_at')
        .in('weekly_cycle_id', cycleIds)
        .order('completed_at', { ascending: false })
        .limit(20);

      // Get rated memories
      const { data: memories } = await supabaseClient
        .from('ritual_memories')
        .select('ritual_title, rating, notes')
        .eq('couple_id', coupleId)
        .order('rating', { ascending: false })
        .limit(10);

      const completedTitles = completions?.map(c => c.ritual_title) || [];
      const uniqueCompleted = [...new Set(completedTitles)];
      
      const highlyRated = memories?.filter(m => m.rating && m.rating >= 4) || [];
      const notesWithContent = memories?.filter(m => m.notes && m.notes.trim()) || [];

      // Get bucket list items
      const { data: bucketList } = await supabaseClient
        .from('bucket_list_items')
        .select('title')
        .eq('couple_id', coupleId)
        .eq('completed', false)
        .limit(20);

      const bucketListItems = bucketList?.map(b => b.title) || [];

      historicalContext = `
HISTORICAL CONTEXT - What They've Experienced:
${uniqueCompleted.length > 0 ? `
✅ Rituals they've already completed (DO NOT REPEAT THESE):
${uniqueCompleted.slice(0, 15).map(title => `- "${title}"`).join('\n')}
${uniqueCompleted.length > 15 ? `... and ${uniqueCompleted.length - 15} more` : ''}
` : '- No rituals completed yet - this is their first week!'}

${highlyRated.length > 0 ? `
⭐ Highly Rated Experiences (4-5 stars) - LEAN INTO THESE THEMES:
${highlyRated.map(m => `- "${m.ritual_title}" (${m.rating}★)`).join('\n')}
` : ''}

${notesWithContent.length > 0 ? `
💭 Their Reflections - USE THESE INSIGHTS:
${notesWithContent.slice(0, 5).map(m => `- "${m.ritual_title}": ${m.notes}`).join('\n')}
` : ''}

${bucketListItems.length > 0 ? `
🎯 THEIR BUCKET LIST - Consider incorporating these dreams:
${bucketListItems.slice(0, 10).map(item => `- "${item}"`).join('\n')}
` : ''}
`;
    }

    if (action === 'swap') {
      const swapPrompt = `You are an expert relationship ritual designer creating ONE alternative ritual to replace the current one.

CONTEXT:
Current ritual to replace: "${currentRitual.title}"
Why they want to swap: They want something different but similarly matched to their needs.

LOCATION CONTEXT:
- City: ${locationContext.city}, ${locationContext.country}
- Local time: ${locationContext.localTime}
- Season: ${locationContext.season}
- Time of day: ${locationContext.timeOfDay}
- Seasonal guidance: ${getSeasonalGuidance(locationContext.season, preferredCity)}

${historicalContext}

THEIR CURRENT INPUTS:
Partner 1: Energy ${partnerOneInput?.energy}, Time ${partnerOneInput?.availability}, Budget ${partnerOneInput?.budget}
Partner 2: Energy ${partnerTwoInput?.energy}, Time ${partnerTwoInput?.availability}, Budget ${partnerTwoInput?.budget}

CRITICAL CREATIVE CONSTRAINTS:
1. DO NOT repeat "${currentRitual.title}" or any completed ritual
2. Match their energy/time/budget constraints closely
3. SURPRISE FACTOR: Make this something they'd never think of themselves (rate your own surprise 1-10, must be 7+)
4. Must feel "worth the swap" - more interesting than what they're replacing
5. Include a micro-detail that makes it memorable
6. LOCATION-AWARE: Must be perfect for ${locationContext.city} in ${locationContext.season}
7. Make it authentically ${locationContext.city}, not a generic date idea

Return ONE ritual as JSON:
{
  "title": "...",
  "description": "...",
  "time_estimate": "...",
  "budget_band": "...",
  "category": "...",
  "why": "One sentence explaining why this is perfect for them right now"
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: swapPrompt }],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const errorText = await response.text();
        console.error('AI API Error:', response.status, errorText);
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content;
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const ritual = JSON.parse(content);

      return new Response(JSON.stringify({ ritual }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Main synthesis with enhanced historical context
    const fullPrompt = `You are an expert relationship ritual designer creating a WEEK of personalized rituals for a couple.

${historicalContext}

THEIR THIS WEEK'S INPUTS:
Partner 1: 
- Energy: ${partnerOneInput?.energy}
- Time Available: ${partnerOneInput?.availability}
- Budget: ${partnerOneInput?.budget}
- Craving: ${partnerOneInput?.craving}
- Heart's Desire: ${partnerOneInput?.desire || 'Not specified'}

Partner 2:
- Energy: ${partnerTwoInput?.energy}
- Time Available: ${partnerTwoInput?.availability}
- Budget: ${partnerTwoInput?.budget}
- Craving: ${partnerTwoInput?.craving}
- Heart's Desire: ${partnerTwoInput?.desire || 'Not specified'}

LOCATION CONTEXT (CRITICAL - All rituals must fit this):
- City: ${locationContext.city}, ${locationContext.country}
- Local time: ${locationContext.localTime}
- Season: ${locationContext.season}
- Time of day: ${locationContext.timeOfDay}
- Seasonal guidance: ${getSeasonalGuidance(locationContext.season, preferredCity)}

CRITICAL CREATIVE CONSTRAINTS:
1. Generate 4-5 rituals that span different categories (connection, adventure, relaxation, creativity, spontaneity)
2. DO NOT repeat any ritual they've already completed (check historical context above)
3. If they have highly rated rituals, incorporate similar THEMES but with fresh twists
4. SURPRISE FACTOR: Each ritual must score 7+ on surprise (1-10 scale). They should think "I never would have thought of this!"
5. Include at least ONE micro-ritual (15-30 min) for busy moments
6. Include at least ONE ritual that gently challenges their comfort zone
7. Honor their heart's desires and cravings with creative interpretation
8. Match their energy and budget constraints realistically
9. LOCATION-AWARE: All rituals must be perfect for ${locationContext.city} in ${locationContext.season}
   - Consider local weather, season, and cultural context
   - ${getSeasonalGuidance(locationContext.season, preferredCity)}
   - Make rituals feel AUTHENTIC to ${locationContext.city}, not generic ideas

SURPRISE FACTOR TEST:
After creating each ritual, ask yourself: "Would they come up with this on their own?" If yes, make it bolder.

Return JSON array:
[
  {
    "title": "...",
    "description": "...",
    "time_estimate": "...",
    "budget_band": "...",
    "category": "...",
    "why": "One sentence explaining why this is perfect for them this week"
  }
]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'user', content: fullPrompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const rituals = JSON.parse(content);

    return new Response(JSON.stringify({ rituals }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in synthesize-rituals:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});