# Widget Install (Client + Internal) — Kalibri Restoration Lead Widget

## What the client receives
The client gets a single embed snippet from:
Dashboard → Widget

They copy/paste it into their website before `</body>`.

They do NOT need to configure any keys.

---

## What is the widget key?
Each client has a unique `widget_key` stored in `chatbot_settings.widget_key`.

It’s a public identifier (NOT a secret like a password).  
Its job is to let the public widget load the correct business configuration (phone/name) and attribute events to the right client.

The embed code includes:
`/widget/kalibri-restoration-widget.js?key=YOUR_WIDGET_KEY`

So the key is already “baked in” for the client.

---

## Where does the widget key come from?
On the Widget page load, if a user has no widget_key yet:
- the app generates one (UUID)
- upserts it into `chatbot_settings`

This means the first time a client opens Dashboard → Widget, they automatically get a working snippet.

---

## What domain does the widget load from?
The embed snippet points to your hosted Kalibri app domain:

`NEXT_PUBLIC_APP_URL`

Examples:
- Production: https://your-app.vercel.app
- Local: http://localhost:3000

✅ You must set `NEXT_PUBLIC_APP_URL` in:
- `.env.local`
- Vercel project environment variables

Without it, the widget install page will fall back to localhost / VERCEL_URL.

---

## How the public widget loads client settings
Public widget script calls:
`/api/widget/config?key=...`

That endpoint uses a service-role Supabase client so it works on public websites (no auth cookies).

It returns:
- client_id
- business_phone
- business_name

---

## Troubleshooting
### Widget doesn’t appear on client site
- Confirm snippet is placed before `</body>`
- Confirm the script URL loads (open it directly in browser)
- Confirm `NEXT_PUBLIC_APP_URL` is correct (points to production)

### Widget appears but Call/Text buttons don’t work
- Client must fill Settings → business_phone
- Confirm `chatbot_settings.business_phone` is populated

### Config endpoint returns Invalid key
- Confirm `chatbot_settings.widget_key` exists for that client
- Regenerate widget key only if needed (rotate key means old embed snippets stop working)

---

## Key rotation policy (optional)
If a client suspects abuse:
- Generate a new widget_key in `chatbot_settings`
- Their old embed snippet stops working
- They must paste the new snippet from Dashboard → Widget
