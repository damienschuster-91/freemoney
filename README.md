# Free Money Directory

220+ scholarships, grants, trades & local foundations. Built with Next.js 14. Deployable on Vercel in ~3 minutes.

## Tech Stack

- **Next.js 14** (App Router) — server-side rendering, static generation, file-based routing
- **TypeScript** — full type safety on scholarship data
- **CSS Modules / global CSS** — white/navy Fraunces + Plus Jakarta Sans design system
- **Vercel** — zero-config deployment, edge CDN, automatic HTTPS

## Project Structure

```
freemoney/
├── app/
│   ├── page.tsx                    ← Homepage
│   ├── layout.tsx                  ← Root layout + Navbar + Footer
│   ├── globals.css                 ← Design system
│   ├── sitemap.ts                  ← Auto-generated sitemap.xml
│   ├── robots.ts                   ← robots.txt
│   ├── scholarships/
│   │   ├── page.tsx                ← /scholarships (listing page)
│   │   ├── ScholarshipsClient.tsx  ← Interactive search/filter (client)
│   │   └── [slug]/page.tsx         ← /scholarships/:slug (detail page)
│   ├── blog/
│   │   ├── page.tsx                ← /blog (post index)
│   │   └── [slug]/page.tsx         ← /blog/:slug (article page)
│   ├── local/
│   │   └── page.tsx                ← /local (state browser)
│   └── about/page.tsx              ← /about
├── components/
│   └── Navbar.tsx
├── lib/
│   ├── data.ts                     ← ALL scholarship data + types
│   └── utils.ts                    ← Site URL, helpers
└── vercel.json
```

## Deploy to Vercel (3 steps)

### 1. Push to GitHub
```bash
cd freemoney
git init
git add .
git commit -m "initial commit"
gh repo create freemoney --public --push  # GitHub CLI
# OR create repo on github.com and push manually
```

### 2. Import on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository" → select your repo
3. Framework will auto-detect as Next.js
4. Add environment variable: `NEXT_PUBLIC_SITE_URL` = your domain (e.g. `https://freemoneydir.com`)
5. Click Deploy

### 3. Add your domain
In Vercel dashboard → Settings → Domains → add your domain.
Update `NEXT_PUBLIC_SITE_URL` to match.

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## After Deploy: Submit to Search Engines

```bash
# 1. Google Search Console
# Go to: https://search.google.com/search-console
# Add property → verify via DNS TXT record
# Submit: https://yourdomain.com/sitemap.xml

# 2. Bing Webmaster Tools
# Go to: https://www.bing.com/webmasters
# Add site → submit sitemap

# 3. IndexNow (instant Bing/Yandex ping)
# POST https://api.indexnow.org/indexnow
# With your site URL + key
```

## Adding Content

### New national scholarship
Edit `lib/data.ts` → add entry to `RAW_SCHOLARSHIPS` array.
Slug is auto-generated from name. Redeploy to publish.

### Local foundations via 990 scraper
```bash
node 990-scraper-agent.js TX CA FL NY   # run locally (needs network)
# Copy output JSON → paste into CMS import at /cms (if re-adding CMS panel)
```

### Real blog posts
Replace the `generateArticle()` function in `app/blog/[slug]/page.tsx`
with MDX files or a headless CMS (Sanity, Contentful, Notion API).

## SEO What's Included

- `<title>` + `<meta description>` on every page via Next.js Metadata API
- Canonical URLs
- Open Graph tags
- JSON-LD structured data (`EducationalOccupationalProgram` on scholarship pages, `Article` on blog pages)
- Auto-generated `sitemap.xml` covering all ~450+ URLs
- `robots.txt`
- Static generation (`generateStaticParams`) for all scholarship + blog pages = instant page loads
- Semantic HTML headings (H1 → H2 → H3)

## SEO Next Steps (Post-Launch)

1. **Google Search Console** — submit sitemap, monitor Coverage report
2. **Expired domain** — SpamZilla / Expireddomains.net for DA20+ edu-adjacent domain
3. **First content push** — write real articles for the 10 no-essay scholarships (highest search volume)
4. **Backlinks** — post in r/scholarships, r/financialaid, reach out to college counselor blogs
5. **IndexNow** — auto-ping on every new post (add a Vercel deploy hook)
