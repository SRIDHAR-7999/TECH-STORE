/* ==========================================================================
   SUPABASE CLIENT — fill in YOUR project URL + anon key below.
   Find both in: Supabase Dashboard → Project Settings → API.
   The "anon" key is safe to expose in frontend code — it only allows what
   your Row Level Security policies (see supabase/schema.sql) permit.
   ========================================================================== */

const SUPABASE_URL = 'https://gmmgketpzopgoidnjhzj.supabase.co';   // SM MOBILE project
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbWdrZXRwem9wZ29pZG5qaHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NjIxNzgsImV4cCI6MjEwMTMzODE3OH0.tIu6oCmx4WNjtZiysPzYQGqqTGDNbgyng0fAK8_Z1wM';

// Loaded via CDN script tag (see index.html / pages/*.html <head>):
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//
// That CDN script is a single point of failure — a slow connection, an
// ad-blocker, or the CDN being briefly down all leave window.supabase
// undefined. Previously that made the very next line throw ("Cannot read
// properties of undefined (reading 'createClient')"), which crashed this
// entire file — and because every other page script runs after this one,
// the whole site broke, not just the database features. Guard it so a
// missing SDK just means "run in local-storage mode", same as an unfilled
// URL/key does.
let supabaseClient = null;
if (SUPABASE_URL.startsWith('http')){
  if (typeof window.supabase !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function'){
    try{
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }catch(err){
      console.warn('[Supabase] createClient failed, using local cache instead:', err.message);
    }
  }else{
    console.warn('[Supabase] SDK script did not load (CDN unreachable?) — using local cache instead.');
  }
}

if (!supabaseClient){
  console.warn('[Supabase] Not configured yet — fill in SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase-client.js');
}
