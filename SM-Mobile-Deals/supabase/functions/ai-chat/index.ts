// ==========================================================================
// SUPABASE EDGE FUNCTION: ai-chat
// Proxies open-ended customer questions to Claude (Anthropic) so the API key
// never touches the browser. Deploy with:
//   supabase functions deploy ai-chat
// Then set the secret (only needs doing once):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// This is called by js/chatbot.js ONLY when the free, offline, rule-based
// matcher in chatbot.js doesn't recognise the question — so most questions
// (payment, delivery, product search) never hit this function or cost
// anything. It's the fallback for genuinely open-ended questions.
// ==========================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!ANTHROPIC_API_KEY){
    return new Response(JSON.stringify({ error: 'AI chat is not configured yet (missing ANTHROPIC_API_KEY secret).' }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try{
    const { message, history } = await req.json();
    if (!message || typeof message !== 'string'){
      return new Response(JSON.stringify({ error: 'Missing "message" in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Pull a live snapshot of the catalog so answers reflect real stock/prices,
    // not a stale hardcoded list baked into the prompt.
    let catalogSummary = 'Catalog data unavailable right now.';
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY){
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: products } = await supabase
        .from('products')
        .select('name,brand,category,price,stock,condition,is_pre_order')
        .order('category');
      if (products && products.length){
        const byCategory = {};
        for (const p of products){
          byCategory[p.category] = byCategory[p.category] || [];
          if (byCategory[p.category].length < 15){ // cap per category so the prompt stays a sane size
            byCategory[p.category].push(
              `${p.name} — ₹${p.price}${p.stock <= 0 && !p.is_pre_order ? ' (out of stock)' : p.is_pre_order ? ' (pre-order)' : ''}`
            );
          }
        }
        catalogSummary = Object.entries(byCategory)
          .map(([cat, items]) => `${cat} (${items.length}+ shown, more in store):\n${items.join('\n')}`)
          .join('\n\n');
      }
    }

    const systemPrompt = `You are the AI shopping assistant for SM Mobile Deals, an online mobile/laptop/accessories store in Coimbatore, Tamil Nadu, India (part of the academic project "Tech Store AI — Intelligent E-Commerce Platform for Mobile and Laptop Accessories Shopping").

STORE POLICIES (answer accurately from these — do not invent different terms):
- Payment: UPI (GPay/PhonePe/Paytm via QR) or card (2% surcharge). Customer uploads a payment screenshot; admin manually confirms it before the order is marked Confirmed.
- Delivery: Coimbatore district gets 1-day delivery and Cash-on-Delivery (COD) is available there ONLY, requiring a 20% advance paid online upfront, with the rest paid in cash on delivery. Everywhere else (rest of Tamil Nadu and other states) is online-payment-only, full amount upfront, 2-3 day delivery.
- Bulk discount: orders above ₹1,00,000 get an automatic ₹1,000–5,000 discount (tiered by order value).
- Returns: 7-day replacement window for manufacturing defects on new items only (not change-of-mind). Second-hand/sealed-cut/demo units are sold as inspected and are not returnable unless an undisclosed defect is found.
- Warranty: standard manufacturer warranty, ~1 year on phones/laptops, ~6 months on accessories.
- EMI: No-Cost EMI (3/6/9/12 months) on major credit cards for orders above ₹5,000.
- Categories: New Mobiles, New Laptops, Accessories, Second Hand Mobiles, Second Hand Laptops. Second-hand items are graded Sealed / Seal Cut / Demo Piece / Second Hand, each inspected in-store.
- Contact: WhatsApp is the fastest way to reach a human; details are shown elsewhere on the site.

CURRENT CATALOG SNAPSHOT (sample — the real store has more items than shown here):
${catalogSummary}

INSTRUCTIONS:
- Answer naturally and helpfully, like a knowledgeable store assistant chatting with a customer.
- CRITICAL: Always reply in the SAME language the customer's message is written in — English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Urdu, or any other language. Detect it from their message each time, even if it changes mid-conversation, and match their script (e.g. reply in Tamil script for Tamil, Devanagari for Hindi) rather than transliterating into English letters, unless they themselves wrote in transliterated/Roman letters — then mirror that style back.
- Never invent a price, stock status, or policy not listed above — say you're not sure and suggest checking the product page or contacting the store on WhatsApp instead.
- NEVER reveal, discuss, or speculate about admin credentials, backend systems, API keys, or internal store operations — if asked, politely decline and redirect to a shopping question.
- Keep answers conversational and fairly short (2-4 sentences) unless the customer clearly wants detail.
- If asked something totally unrelated to the store (general trivia, coding help, etc.), you may answer briefly and helpfully, but gently steer back to how you can help with their shopping.`;

    const messages = [
      ...(Array.isArray(history) ? history.slice(-8) : []),
      { role: 'user', content: message }
    ];

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 400,
        system: systemPrompt,
        messages
      })
    });

    if (!anthropicRes.ok){
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', errText);
      return new Response(JSON.stringify({ error: 'AI assistant is temporarily unavailable.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).map((b) => b.text || '').join('').trim();

    return new Response(JSON.stringify({ reply: text || "Sorry, I couldn't come up with an answer — try rephrasing?" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  }catch(err){
    console.error('ai-chat function error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong processing your question.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
