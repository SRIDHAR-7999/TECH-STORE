# Tech Store AI — Intelligent E-Commerce Platform for Mobile and Laptop Accessories Shopping
### Shop: SM Mobile Deals

**Genuine mobiles, laptops, smart watches & accessories — Coimbatore.**
Academic project: *Tech Store AI — Intelligent E-Commerce Platform for Mobile and Laptop Shopping* (Sridhar S, Sri Ramakrishna College of Arts & Science, 2026), built for **SM Mobiles**.

A production-styled, fully working e-commerce front end: catalog, cart, wishlist, compare, checkout, UPI/QR payment with screenshot verification, order tracking, customer accounts, an admin dashboard, and a multilingual AI FAQ assistant. Runs as static HTML/CSS/JS — **no build step** — backed by **Supabase** (Postgres + Auth + Storage).

---

## 1. How to run it

Just open `index.html` in a browser — or, better, serve the folder so relative paths and the service worker behave correctly:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## 2. Connecting your Supabase database

The site works **even without a database connected** — it falls back to the browser's `localStorage` automatically. To connect real Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New Query**, paste the entire contents of `supabase/schema.sql`, and run it. This creates every table (products, categories, orders, profiles, reviews, offers), Row Level Security policies, the `payment-screenshots` storage bucket, and seeds a starter catalog.
3. Go to **Project Settings → API**, copy your **Project URL** and **anon public key**.
4. Paste both into `js/supabase-client.js`:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
5. Reload the site — every page now reads/writes through Supabase instead of localStorage. No other code changes needed.

**Making yourself admin:** sign up normally through `pages/register.html` once, then in the Supabase SQL Editor run:
```sql
update profiles set role = 'admin' where id = '<your-user-uuid>';
```
(find the UUID under **Authentication → Users** after you sign up). Alternatively, the built-in admin login (`sridhariphone7@gmail.com` / `SRIDHAR7@#`, set in `js/config.js`) always works, Supabase or not.

## 3. How the data layer is designed

`js/data.js` and `js/auth.js` are **hybrid**: every read (`DB.getProducts()`, `Auth.currentUser()`, etc.) is synchronous, served from a local cache. `DB.init()` and `Auth.init()` are the only async calls — they populate that cache from Supabase once per page load (see `App.boot()` in `js/app.js`, which every page calls before rendering). Writes that need to reach the database (`DB.saveOrder`, `DB.saveProducts`, `Payment.confirmPayment`, etc.) are `async` and awaited by their callers.

If `js/supabase-client.js` still has the placeholder URL/key, `DB.useSupabase()` returns `false` and everything transparently uses `localStorage` instead — so the site is always demoable, connected or not.

## 4. Payment flow (exactly as specified)

1. Customer checks out (must be logged in) → chooses UPI / Card / COD. **COD is only offered within Coimbatore district** — everywhere else (rest of Tamil Nadu and other states) is online payment only.
2. **COD orders require a 20% advance paid online** (`SITE_CONFIG.codAdvancePercent` in `js/config.js`) — the remaining amount is collected in cash on delivery. Every order, COD or fully-online, goes through the same Payment page for whatever amount is due right now.
3. On the **Payment** page, a QR code is generated with the **exact amount due pre-filled** (via `upi://pay?...` deep link), plus direct GPay / PhonePe / Paytm buttons and the UPI ID `sridharss400@oksbi` with a copy button.
4. Customer pays in their own UPI app, then **uploads a screenshot** of the successful payment. The image is uploaded to the Supabase Storage `payment-screenshots` bucket (or kept as a local data URL if Supabase isn't connected).
5. The order status becomes **"Waiting for Confirmation"** — *not* "Order Successful" yet.
6. The **admin** opens `pages/admin.html` → **Pending Payments** tab, reviews the screenshot, and clicks **Confirm** or **Reject**.
7. Once confirmed, the customer's order page (which re-polls Supabase every few seconds) flips to **"Order Successful"** — showing the remaining cash-on-delivery amount if applicable — and the order enters the fulfilment pipeline (Confirmed → Packed → Shipped → Out for Delivery → Delivered), trackable on `pages/tracking.html`.

Card payments add a 2% processing surcharge, shown at checkout before payment.

## 5. Admin access

```
Email:    sridhariphone7@gmail.com
Password: SRIDHAR7@#
```

This shortcut always works locally regardless of Supabase. **Change it** in `js/config.js` before putting the site anywhere public, or promote a real Supabase account to `role = 'admin'` instead (see §2).

## 6. Updating your shop info, payment & social links

Everything — shop name, address, phone numbers, UPI ID, and Instagram/WhatsApp/Threads/Facebook links — lives in **one file**: `js/config.js`. Change a value there and it updates everywhere on the site (footer, contact page, chatbot answers, payment page).

**Facebook is currently blank** (`social.facebook.url`) — no link was provided, so the Facebook icon is automatically hidden until you add one.

QR code images (`assets/images/qr-upi-payment.jpg`, `qr-instagram.png`, `qr-whatsapp.png`, `qr-facebook.png`, `qr-threads.png`) are the ones you supplied. The **payment page** additionally generates a *dynamic* QR with the exact order amount baked in, falling back to your static UPI QR image if that's unreachable.

## 7. AI FAQ Assistant

Click the floating chat bubble (bottom-left, every page). It understands greetings, store/contact info, payment/delivery/warranty questions, and brand/category/budget product search ("phones under 30000"). Supports **English, Tamil (தமிழ்) and Hindi (हिंदी)** — switch with the dropdown in the chat header, or extend `I18N` in `js/chatbot.js` for more. Runs entirely with local keyword/intent matching — no external AI API call, works offline, zero running cost.

## 8. Folder structure

```
SM-Mobile-Deals/
├── index.html
├── manifest.json / service-worker.js     — PWA support
├── supabase/schema.sql                   — run once in Supabase SQL Editor: tables + RLS + seed data
├── supabase/functions/ai-chat/           — Edge Function proxying customer questions to Claude (§12)
├── assets/                               — images, QR codes, icons, logos
├── css/                                  — variables, components, layout, responsive, animations, dark mode
├── js/                                   — supabase-client, config, data layer, auth, cart/wishlist/compare,
│                                            checkout, payment, orders, admin, chatbot, shared UI, app bootstrap
└── pages/                                — every other page (shop, cart, checkout, payment, orders, tracking,
                                             login, register, admin-login, profile, admin, about, contact, privacy,
                                             second-hand-mobiles, second-hand-laptops)
```

## 9. Known limitations (be upfront about these)

- **Not a real payment gateway.** No money actually moves through this website — customers pay you directly via their own UPI app, and you verify manually. This is intentional and matches the project brief.
- **Demo-grade auth fallback.** When Supabase isn't connected, passwords are hashed with a simple non-cryptographic function client-side — fine for a local demo, not for real customer accounts. Once Supabase is connected (§2), real Supabase Auth (bcrypt-hashed, server-side) is used instead.
- **Row Level Security assumes you ran `supabase/schema.sql` as-is.** If you rename tables/columns, update the policies too.
- **Product images are procedurally generated device silhouettes**, not real photos (to avoid using unlicensed brand photography). Swap in real photos by replacing `Utils.deviceImage()` calls with `<img>` tags pointing at files you place in `assets/images/`.

## 11. What's new — second-hand catalog, discounts, smarter chatbot

- **Second Hand category** — 50 pre-loaded listings (Apple, Samsung S/Z series, Vivo, Oppo, Xiaomi, Redmi, Realme) tagged **Sealed / Seal Cut / Demo Piece / Second Hand**, priced automatically off each model's original price. Filter by condition on the Shop page once "Second Hand" is selected.
- **Bulk-purchase discount** — orders above ₹1,00,000 automatically get ₹1,000–5,000 off (tiered), shown at checkout.
- **Real product photos/videos** — the admin product form now has an image upload (or paste-a-URL) and a video upload (or paste-a-URL) field. Leave both blank to keep the default placeholder icon. **Note:** real Amazon/brand product photography can't be scraped or reproduced here for copyright reasons — upload your own photos of the actual second-hand unit, or your own catalog shots.
- **Smarter chatbot** — understands "low budget"/"budget friendly" searches (≤₹20,000, cheapest first), can look up a specific order status by ID, and only shows the UPI QR + WhatsApp details when someone explicitly says something like "confirm my payment" or "I've paid" — not on generic payment questions. When a search matches more than 4 products, it links to the full filtered results on the Shop page.
- **Cart/wishlist reminders** — a toast nudge (max 5 times/day) when there are unpurchased items in the cart or wishlist. **Limitation:** this only fires while the site is open in a browser tab — it is not a real phone push notification (that needs a backend + push server, out of scope for a static site).
- **Admin Team tab** — an existing admin can promote any already-registered customer to admin (by email) or remove admin access, without ever needing a public "become admin" signup page (which would be a security risk). Requires Supabase to be connected (§2).

## 12. Real AI chatbot (optional upgrade)

By default the chatbot in `js/chatbot.js` is a free, offline, rule-based matcher — it handles payment/delivery/warranty/product-search questions instantly with zero cost, but it can't answer genuinely open-ended questions.

To make it answer **anything** a customer might ask (using real Claude AI), wire up the included Supabase Edge Function:

1. **Get an Anthropic API key** at [console.anthropic.com](https://console.anthropic.com) (pay-as-you-go — each AI-answered question costs a small fraction of a cent to a few cents depending on length; the rule-based matcher above handles most questions for free, so this only fires for the ones it can't).
2. **Install the Supabase CLI** if you haven't: `npm install -g supabase`.
3. From the project folder, log in and link your project:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>   # found in your Supabase project URL
   ```
4. **Deploy the function**:
   ```bash
   supabase functions deploy ai-chat
   ```
5. **Set your API key as a secret** (never goes in any file, never exposed to the browser):
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
6. That's it — `js/chatbot.js` already calls this function automatically whenever a question doesn't match its free rule-based intents, using your already-configured `SUPABASE_URL`/`SUPABASE_ANON_KEY` from `js/supabase-client.js`. No further code changes needed.

**How it stays safe**: the Edge Function's system prompt explicitly instructs Claude to never discuss admin credentials, API keys, or backend internals, and to only answer from the real store policies and a live snapshot of your product catalog — not to invent prices or policies. Your Anthropic key lives only in Supabase's secret store, never in any file in this repository or in the browser.

## 13. Still missing / to add

- **Facebook page link** — not supplied yet, icon is hidden until you add it to `js/config.js`.
- Real product photography for the catalog (see §11 — upload your own via the admin panel).
- Deploy the frontend to **Vercel** (drag-and-drop the folder or connect a GitHub repo — no build command needed, it's static HTML).
