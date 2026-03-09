# 🚀 AI Creator Studio — Launch Checklist

## Price: $97 (launch price, raise to $147 after 50 sales)

---

## STEP 1: Stripe Account (5 min)

If you already have Stripe, skip to grabbing keys.

1. Go to https://dashboard.stripe.com
2. Sign in or create account
3. Grab your keys (Settings → Developers → API Keys):
   - **Publishable key** → starts with `pk_live_`
   - **Secret key** → starts with `sk_live_`
4. Add to your `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   ```

**Note:** You do NOT need Stripe for Whop sales. Whop handles payments.
Stripe is only needed if YOU want checkout inside your app (for your buyers' customers).

---

## STEP 2: Whop Seller Account (15 min)

### Create Account
1. Go to https://whop.com/sell
2. Click "Start Selling"
3. Create your seller account
4. Complete identity verification (may take a few hours)

### Create Your Product
1. Click "Create Product"
2. Fill in:
   - **Name:** AI Creator Studio
   - **Price:** $97.00 (one-time)
   - **Type:** Digital Product / Software

### Product Description (copy this):
```
🎬 AI Creator Studio — Download. Create. Profit.

The all-in-one AI content creation platform. Stop paying for 6 different tools.

WHAT'S INCLUDED:
✅ Full source code (Next.js + TypeScript)
✅ AI video generation (Kling, HeyGen, Arcads)
✅ Voice cloning (ElevenLabs)
✅ AI script writing (Claude)
✅ Instagram, TikTok, YouTube publishing
✅ ManyChat automation ready
✅ Stripe checkout built in
✅ Analytics dashboard
✅ Campaign & project management
✅ Setup wizard — running in 5 minutes
✅ Deploy to Vercel (free hosting)
✅ Lifetime updates

HOW IT WORKS:
1. Download the code
2. Deploy to Vercel (free, one-click)
3. Connect your AI accounts (free tiers available)
4. Start creating and publishing AI content

PERFECT FOR:
• AI UGC agencies (charge $500-2K/video, cost: $50)
• Faceless content channels
• Digital product sellers
• AI influencer accounts
• Dropshipping ad creation

All AI services have free tiers to get started. No coding required.
```

### Delivery Setup
**Option A: Downloadable Zip (simplest)**
1. Once the app is built, create a zip of the repo (minus node_modules, .env, .git)
2. Upload to Whop as the delivery file
3. Buyer pays → instantly gets download link

**Option B: Private GitHub Repo (better for updates)**
1. Create private repo: `ai-creator-studio` on your GitHub
2. On Whop, set delivery to "Link" → provide repo link
3. After purchase, buyer gets invited to repo (manual) OR you use Whop's GitHub integration
4. Buyers get updates when you push

**Recommendation: Start with Option A (zip).** Less friction. Switch to GitHub repo later.

### Get Your Product URL
- After creating the product, Whop gives you a URL like:
  `https://whop.com/ai-creator-studio/`
- **Save this URL** — it goes in your landing page CTA buttons
- Add to `.env`:
  ```
  NEXT_PUBLIC_WHOP_CHECKOUT_URL=https://whop.com/ai-creator-studio/
  ```

---

## STEP 3: GitHub Private Repo (5 min)

```bash
cd /Users/nickdowning/ai-creator

# Create private repo on GitHub
gh repo create ai-creator-studio --private --source . --remote origin --push

# OR if you want to keep it separate from your dev repo:
# Just zip it when ready (see packaging step below)
```

---

## STEP 4: Package for Distribution

When the app is fully built and tested:

```bash
cd /Users/nickdowning/ai-creator

# Make sure .gitignore is clean
echo "node_modules/
.next/
.env
.env.local
public/uploads/
*.log
.DS_Store
BUILD-SPEC.md
LAUNCH-CHECKLIST.md" > .gitignore

# Create distribution zip
cd ..
zip -r ai-creator-studio-v1.0.zip ai-creator/ \
  -x "ai-creator/node_modules/*" \
  -x "ai-creator/.next/*" \
  -x "ai-creator/.env" \
  -x "ai-creator/.git/*" \
  -x "ai-creator/public/uploads/*" \
  -x "ai-creator/BUILD-SPEC.md" \
  -x "ai-creator/LAUNCH-CHECKLIST.md"
```

The zip should include:
- ✅ All source code
- ✅ .env.example (with blank keys)
- ✅ README.md (with setup instructions + Deploy to Vercel button)
- ✅ prisma/ (schema + migrations)
- ✅ package.json
- ❌ NOT .env (has your real keys)
- ❌ NOT node_modules
- ❌ NOT .git

---

## STEP 5: ManyChat Setup (15 min)

1. Go to https://manychat.com
2. Sign up for Pro ($15/mo) — connect your Instagram Business account
3. Create a new Automation:
   - **Trigger:** Instagram Comment → Keyword
   - **Keywords:** "AI", "CREATOR", "TOOL", "LINK"
   - **Action:** Send DM with message:

```
Hey! 🔥 Here's your access to AI Creator Studio:

👉 [YOUR WHOP URL]

This is the all-in-one AI content creation platform.
Generate videos, clone voices, publish everywhere.

Questions? Just DM me!
```

4. Apply this automation to specific posts (your demo/marketing reels)

---

## STEP 6: Deploy Landing Page

Once the landing page is built:

```bash
# Option 1: Deploy the whole app (landing page + app together)
# Buyer gets the same repo minus landing page OR you keep it

# Option 2: Deploy landing page separately (recommended)
# Create a simple standalone landing page on Vercel
```

For the domain:
- Buy `aicreatorstudio.com` or similar (Namecheap, ~$12/year)
- Point it to your Vercel deployment
- Landing page lives at the root

---

## STEP 7: Instagram Content Plan

Post types that convert:
1. **Screen recording** — walk through creating a video in the app (30-60 sec)
2. **Before/after** — "This used to take 6 hours. Now: 12 minutes."
3. **Results** — show dashboard with metrics (even demo data)
4. **Hook-style** — "I built a tool that creates AI videos in one click"
5. **Tutorial** — "How to make $500/day with AI content" (show the tool)

Every post ends with: **"Comment AI for the link"**

Post 1-2x per day for the first 2 weeks. Reels perform best.

---

## LAUNCH DAY SEQUENCE

### Morning:
- [ ] Verify app is fully working
- [ ] Take screenshots of polished app
- [ ] Record 60-sec screen demo
- [ ] Deploy landing page to Vercel with real Whop URL
- [ ] Upload zip to Whop (or connect GitHub repo)
- [ ] Test buy flow end-to-end (use Whop test mode)

### Afternoon:
- [ ] Post first Instagram Reel showing the app
- [ ] Post on Twitter/X announcing launch
- [ ] Post on r/SideProject (follow their rules)
- [ ] Activate ManyChat automation on your post
- [ ] Share in any relevant Discord/Slack communities

### First Week:
- [ ] Post daily (1-2 reels showing different features)
- [ ] Respond to every comment and DM
- [ ] Collect feedback from first buyers
- [ ] Fix any issues they report
- [ ] Post buyer wins/testimonials as they come in

---

## REVENUE TARGETS

| Sales/Month | Revenue (at $97) | Notes |
|-------------|------------------|-------|
| 10 | $940 | Validation — it works |
| 25 | $2,425 | Momentum building |
| 50 | $4,700 | Raise price to $147 |
| 100 | $9,400 | Solid side income |
| 200+ | $19,400+ | Consider SaaS model |

**Break-even:** Your cost is essentially $0 (your time + $15/mo ManyChat). First sale is pure profit.

---

## ORDER OF OPERATIONS

1. ✅ BUILD-SPEC.md is ready for Claude Code
2. ⬜ Build the app (Claude Code — Phases 1-6)
3. ⬜ Create Whop seller account (do this NOW while Claude Code builds)
4. ⬜ Create Whop product listing
5. ⬜ Take screenshots + record demo
6. ⬜ Deploy landing page
7. ⬜ Package zip + upload to Whop
8. ⬜ Set up ManyChat
9. ⬜ Post first Instagram content
10. ⬜ 💰 First sale

---

*Last updated: March 9, 2026*
