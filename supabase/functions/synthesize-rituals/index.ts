import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    
    const { action, weeklyInputs, partnerOneInput, partnerTwoInput, coupleId, canvasStateOne, canvasStateTwo } = await req.json();
    
    // Handle Magnetic Canvas synthesis
    if (action === 'canvas') {
      const alignments = new Set([
        ...(canvasStateOne?.alignments || []),
        ...(canvasStateTwo?.alignments || [])
      ]);

      const combinedPriorities: Record<string, number[]> = {};
      [...(canvasStateOne?.priorities || []), ...(canvasStateTwo?.priorities || [])].forEach((p: any) => {
        if (!combinedPriorities[p.token]) {
          combinedPriorities[p.token] = [];
        }
        combinedPriorities[p.token].push(p.strength);
      });

      const avgPriorities = Object.entries(combinedPriorities)
        .map(([token, strengths]: [string, number[]]) => ({
          token,
          avgStrength: strengths.reduce((a: number, b: number) => a + b, 0) / strengths.length
        }))
        .sort((a, b) => b.avgStrength - a.avgStrength);

      const systemPrompt = `You are a ritual designer creating personalized relationship rituals based on emotional alignment data from a Magnetic Canvas interface.

The couple has expressed their desires through token positioning:
- Alignments (tokens that snapped together): ${Array.from(alignments).join(', ')}
- Priority ranking: ${avgPriorities.map(p => `${p.token} (${Math.round(p.avgStrength)}%)`).join(', ')}

Generate 7 unique rituals (one per day) that:
1. Heavily emphasize the aligned tokens (these are areas of mutual desire)
2. Weight towards high-priority tokens
3. Create a balanced week that flows naturally
4. Each ritual should be specific, actionable, and meaningful

Return ONLY a JSON array with this exact structure:
[
  {
    "day": "Monday",
    "title": "Ritual name",
    "description": "2-3 sentence description",
    "timeEstimate": "15-30 min",
    "category": "connection|adventure|rest|intimacy|play|growth"
  }
]`;

      const userPrompt = `Create 7 rituals based on this emotional data:
Alignments: ${Array.from(alignments).join(', ')}
Priorities: ${JSON.stringify(avgPriorities)}`;

      console.log("Generating canvas rituals with Lovable AI");

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const rituals = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

      return new Response(
        JSON.stringify({ rituals }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle swap action - generate a single alternative ritual
    if (action === 'swap') {
      const { currentRitual, inputs } = weeklyInputs;
      
      const swapPrompt = `You are a creative ritual designer for couples in New York City. Generate ONE surprising and delightful alternative ritual that is different from this current one:

Current Ritual: ${currentRitual.title}
${currentRitual.description}

Partner 1 Inputs:
- Energy: ${inputs.partner_one_input.energy}
- Time: ${inputs.partner_one_input.availability}
- Budget: ${inputs.partner_one_input.budget}
- Craving: ${inputs.partner_one_input.craving}
- Desire: "${inputs.partner_one_input.desire}"

Partner 2 Inputs:
- Energy: ${inputs.partner_two_input.energy}
- Time: ${inputs.partner_two_input.availability}
- Budget: ${inputs.partner_two_input.budget}
- Craving: ${inputs.partner_two_input.craving}
- Desire: "${inputs.partner_two_input.desire}"

Create a completely different NYC-specific ritual that:
- Is unexpected and delightful, not generic
- Takes advantage of NYC's unique neighborhoods, culture, food scene, or hidden gems
- Balances BOTH partners' energy levels, time availability, budget, cravings, and desires
- Synthesizes their different inputs into one harmonious experience
- Has personality and spark specific to NYC living
- Feels special, not like a typical date
- Include sensory details and NYC-specific locations or experiences

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "Ritual name (creative, not generic)",
  "category": "Connection|Rest|Fun|Exploration|Comfort|Intimacy",
  "description": "Vivid, specific description with sensory details (2-3 sentences)",
  "time_estimate": "30 min|1 hour|1.5 hours|2 hours|3 hours",
  "budget_band": "Free|$|$$|$$$"
}`;

      console.log("Generating swap ritual with Lovable AI");
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: swapPrompt }
          ],
          temperature: 1.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      let ritualText = data.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      ritualText = ritualText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const ritual = JSON.parse(ritualText);
      console.log("Generated swap ritual:", ritual);
      
      return new Response(JSON.stringify({ ritual }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Original synthesis for full week of rituals
    const partner_one = partnerOneInput;
    const partner_two = partnerTwoInput;
    
    const synthesisPrompt = `You are a creative ritual designer creating a week of shared experiences for a couple living in New York City. Be creative, unexpected, and delightful.

Partner 1:
- Energy: ${partner_one.energy}
- Time: ${partner_one.availability}
- Budget: ${partner_one.budget}
- Craving: ${partner_one.craving}
- Desire: "${partner_one.desire}"

Partner 2:
- Energy: ${partner_two.energy}
- Time: ${partner_two.availability}
- Budget: ${partner_two.budget}
- Craving: ${partner_two.craving}
- Desire: "${partner_two.desire}"

CRITICAL: Analyze BOTH partners' inputs carefully and create rituals that:
- Balance and synthesize their different energy levels, time constraints, budgets, and desires
- Find creative compromises when their inputs differ (e.g., one has low energy, one has high)
- Respect BOTH partners' cravings and incorporate elements from each
- Consider the time availability of BOTH (if one has 30min and other has 2hrs, suggest ~1hr activities)
- Stay within the lower budget constraint to ensure accessibility for both
- Weave BOTH desires into each ritual in meaningful ways

Create 4-5 surprising, NYC-specific rituals that:
- Are NOT generic (avoid "sunset picnic", "coffee date" unless adding unique NYC twist)
- Leverage NYC's unique neighborhoods, hidden gems, food scene, culture, and energy
- Have personality and rich sensory details specific to NYC
- Balance BOTH partners' needs creatively and explicitly
- Feel special and memorable - uniquely New York moments
- Range from quick moments to longer experiences based on their time availability
- Include unexpected combinations that only NYC can offer
- Make people say "wow, I never thought of that!" and "this is so us AND so NYC!"
- Reference specific NYC locations, neighborhoods, or experiences when relevant

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
  {
    "title": "Creative ritual name",
    "category": "Connection|Rest|Fun|Exploration|Comfort|Intimacy",
    "description": "Vivid, specific description with sensory details (2-3 sentences)",
    "time_estimate": "30 min|1 hour|1.5 hours|2 hours|3 hours",
    "budget_band": "Free|$|$$|$$$"
  }
]`;

    console.log("Synthesizing rituals with Lovable AI for couple:", coupleId);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 1.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    let ritualsText = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    ritualsText = ritualsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const rituals = JSON.parse(ritualsText);
    console.log("Generated rituals:", rituals.length);

    return new Response(JSON.stringify({ rituals }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in synthesize-rituals function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to synthesize rituals',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});