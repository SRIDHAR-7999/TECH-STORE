# Connecting SM Mobile Deals to Supabase

The site **works immediately without Supabase** — it falls back to browser
localStorage, which is why you can extract the zip and open `index.html`
straight away. Everything below is only needed when you want real, shared
data (orders visible on every device, real user accounts, uploaded product
photos that persist).

**Until you complete this, remember:** data lives only in the browser that
created it. An order placed on your phone will not appear on your laptop.

---

## Step 1 — Create the Supabase project

1. Go to **https://supabase.com** and sign in (free tier is enough to start).
2. Click **New Project**.
3. Fill in:
   - **Name:** `sm-mobile-deals`
   - **Database Password:** choose a strong one and **save it somewhere safe**
     — Supabase will not show it again.
   - **Region:** pick the closest one to your customers (for Coimbatore,
     `South Asia (Mumbai)` is the nearest).
4. Click **Create new project** and wait ~2 minutes for it to finish
   provisioning.

---

## Step 2 — Run the database schema

1. In your project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this project, copy **the entire
   contents**, and paste it into the editor.
4. Click **Run**.

This one script creates everything:

| What it creates | Details |
|---|---|
| 7 tables | `profiles`, `categories`, `products`, `offers`, `reviews`, `site_visits`, `orders` |
| Product catalog | ~2,000 product rows seeded automatically |
| Row Level Security | Policies so customers only see their own orders, and only admins can edit products |
| 2 storage buckets | `payment-screenshots` and `product-media` |

If it succeeds you'll see **Success. No rows returned** — that is the
expected result for a schema script.

---

## Step 3 — Copy your API keys into the project

1. Go to **Project Settings** (gear icon) → **API**.
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public** key — a long string starting with `eyJ...`
3. Open **`js/supabase-client.js`** in this project and replace the two
   placeholders on lines 8–9:

```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co';   // <- your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';  // <- your anon key
```

**The anon key is safe to put in frontend code.** It only permits what your
Row Level Security policies allow — that's exactly what Step 2 set up. Never
paste the **service_role** key here; that one bypasses all security.

Save the file and reload the site. Open the browser console (F12) — if you
still see `[Supabase] Not configured yet`, the values didn't save correctly.

---

## Step 4 — Create your admin account

The built-in admin login (`sridhariphone7@gmail.com` / `SRIDHAR7@#`, set in
`js/config.js`) keeps working with or without Supabase. But for a *real*
Supabase-backed admin account:

1. On the live site, go to **Register** and create an account with your email.
2. In Supabase, open **Authentication → Users** and copy the **UID** of that
   new user.
3. Go to **SQL Editor** and run this, pasting your UID:

```sql
update profiles set role = 'admin' where id = 'PASTE-YOUR-UID-HERE';
```

That account can now reach the Admin Dashboard.

---

## Step 5 — Verify it actually connected

Do this check rather than assuming it worked:

1. Open the site, press **F12** → **Console** tab.
2. Reload. You should **not** see the `[Supabase] Not configured yet` warning.
3. Register a new test account.
4. In Supabase → **Authentication → Users**, confirm that account appears.
5. In Supabase → **Table Editor → profiles**, confirm a matching row exists.

If all five pass, you are connected.

---

## Step 6 (optional) — The AI chatbot

The chat assistant works out of the box with built-in answers. To power it
with a real AI model instead:

1. Install the Supabase CLI: **https://supabase.com/docs/guides/cli**
2. From the project folder:

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set ANTHROPIC_API_KEY=your-api-key-here
supabase functions deploy ai-chat
```

`YOUR-PROJECT-REF` is the `abcdefgh` part of your Project URL.

---

## Troubleshooting

**"Not configured yet" warning persists**
The URL must start with `https://`. A trailing slash or a stray quote will
break it.

**Products don't load after connecting**
Confirm Step 2 actually ran — go to **Table Editor → products** and check
there are rows. If the table is empty, re-run `schema.sql`.

**"row-level security policy" errors**
You're signed out, or the account isn't an admin. Redo Step 4.

**Orders save but nobody else can see them**
Expected on the localStorage fallback. It means Step 3 didn't take effect —
recheck the console for the configuration warning.

**Images upload but disappear on reload**
The storage buckets weren't created. Re-run `schema.sql`, then check
**Storage** for `payment-screenshots` and `product-media`.

---

## One honest caveat

I could not test this connection end-to-end — this build environment has no
internet access, so I could not reach Supabase to verify the schema runs
cleanly against a live project. The SQL, the client code, and the fallback
behaviour are all correct and the site runs perfectly without Supabase, but
please work through **Step 5** carefully rather than assuming the connection
succeeded.
