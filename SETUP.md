# Decap CMS Setup Guide
## Riesentöter PCA Website

This guide sets up Decap CMS so club editors can manage content at
`https://tomloder.github.io/fancytown/admin` without touching code.

---

## What editors can manage

| Section | What changes |
|---|---|
| Site Settings | Title, contact email, social links |
| Homepage | Hero image/text, Drive section, Join section |
| Upcoming Events | Events crawl on homepage + Drive with Us page |
| News & Articles | Homepage news cards + article pages |
| Sponsors | Sponsor logos and links |
| HPDE Schedule | Events page with track details |
| Member Anniversaries | Ticker banner (replaces Excel upload) |
| Der Gasser Newsletter | Cover image, PDF link, description |

---

## Step 1 — OAuth Setup (one-time, ~10 minutes)

GitHub Pages can't handle server-side OAuth, so you need a tiny free proxy.
The easiest option is a free **Cloudflare Worker**.

### 1a. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. Fill in:
   - **Application name:** Riesentöter PCA CMS
   - **Homepage URL:** `https://tomloder.github.io/fancytown`
   - **Authorization callback URL:** `https://decap-proxy.YOUR-SUBDOMAIN.workers.dev/callback`
     *(you'll get this URL in the next step — come back and update it)*
3. Click **Register application**
4. Copy the **Client ID** and generate a **Client Secret** — save both

### 1b. Deploy the Cloudflare Worker

1. Sign up free at [cloudflare.com](https://cloudflare.com)
2. Go to **Workers & Pages → Create Worker**
3. Click **Edit code** and paste the contents of this repo:
   👉 https://github.com/bericp1/netlify-cms-oauth-provider-node *(adapt for Workers)*

   Or use the ready-made template:
   👉 https://github.com/decaporg/decap-simple-oauth

4. Set these **Environment Variables** in your Worker settings:
   - `GITHUB_CLIENT_ID` = your Client ID from Step 1a
   - `GITHUB_CLIENT_SECRET` = your Client Secret from Step 1a
   - `ORIGIN` = `https://tomloder.github.io`

5. Deploy and note your Worker URL: `https://decap-proxy.YOUR-SUBDOMAIN.workers.dev`

### 1c. Update config.yml

Open `admin/config.yml` and replace the `base_url` line:
```yaml
base_url: https://decap-proxy.YOUR-SUBDOMAIN.workers.dev
```

Also go back to GitHub (Step 1a) and update the callback URL to match.

---

## Step 2 — Connect the CMS loader to your HTML pages

Add these two lines before `</body>` in **index.html**:

```html
<script src="/cms-loader.js"></script>
<script>CMS.initHomepage();</script>
```

Add this to **hpde-events.html** before `</body>`:
```html
<script src="/cms-loader.js"></script>
<script>CMS.initHPDEEvents();</script>
```

Add `id="hpde-events-container"` to the events container div in hpde-events.html.

---

## Step 3 — Push everything to GitHub

Commit and push all new files:
```
admin/
  index.html
  config.yml
_data/
  settings.json
  homepage.json
  events/
  news/
  sponsors/
  hpde/
  anniversaries/
  newsletter/
cms-loader.js
generate-manifests.js
.github/workflows/manifests.yml
```

---

## Step 4 — Test it

1. Go to `https://tomloder.github.io/fancytown/admin`
2. Click **Login with GitHub**
3. Authorise the app
4. You should see the Decap CMS dashboard

---

## How editing works (for non-technical editors)

1. Go to `yoursite.com/admin`
2. Log in with your GitHub account (must have access to the repo)
3. Click a section (e.g. **Upcoming Events**)
4. Add, edit, or delete entries using the form UI
5. Click **Publish** — changes are saved to GitHub automatically
6. The GitHub Action runs, regenerates the manifest files, and the site updates within ~30 seconds

---

## Granting editor access

Editors need to be **collaborators** on the GitHub repo:
- Go to your repo → **Settings → Collaborators → Add people**
- Add their GitHub username with **Write** access

---

## Local development

To preview changes locally, run a simple HTTP server (not `file://`):
```bash
npx serve .
# or
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

The CMS admin won't work locally (OAuth requires HTTPS), but you can edit
the JSON files in `_data/` directly and run `node generate-manifests.js`.
