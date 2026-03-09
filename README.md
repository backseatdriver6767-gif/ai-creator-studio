# 🎬 AI Creator Studio

> **Create AI videos. Post everywhere. Make money. All in one platform.**

Thank you for purchasing AI Creator Studio! This is your complete full-stack platform for AI content creation and monetization.

**What you have:**
- ✅ Full Next.js 16 source code
- ✅ Production-ready AI video generation
- ✅ Multi-platform social media posting
- ✅ Built-in Stripe monetization
- ✅ Complete documentation & setup guide
- ✅ Lifetime access to updates

## ✨ Features

### 🎥 AI Video Generation (3 Tiers)
- **Premium**: Arcads AI - Photorealistic avatars, enterprise quality
- **Standard**: HeyGen - Great quality with ElevenLabs voices built-in
- **Budget**: Kling + ElevenLabs - Cost-effective cinematic video

### 📱 Multi-Platform Publishing
- Instagram (Direct API via Meta Graph API)
- TikTok (via Late.dev)
- YouTube (via Late.dev)
- Automated posting & scheduling

### 💰 Built-in Monetization
- Stripe integration for payments
- ManyChat for comment-to-DM automation
- Product & campaign management
- Order tracking & analytics

### 🤖 AI-Powered Content
- Claude (Anthropic) - Script writing
- GPT-4o (OpenAI) - Image analysis
- ElevenLabs - Voice generation
- Gemini - Image generation

### 📊 Analytics & Tracking
- Real-time performance metrics
- Order & revenue tracking
- Content analytics
- API usage monitoring

## 🚀 Quick Start (10 Minutes)

### Step 1: Get Your API Keys

Before deploying, sign up for these services (most have free tiers):

**Required:**
- [Anthropic](https://console.anthropic.com) - Claude API
- [OpenAI](https://platform.openai.com) - GPT-4o API
- [Stripe](https://dashboard.stripe.com) - Payments
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) - Database

**Video Generation (choose one):**
- [HeyGen](https://heygen.com) - Recommended (Standard tier)
- [Arcads](https://www.arcads.ai) - Premium tier
- [Kling](https://klingai.com) + [ElevenLabs](https://elevenlabs.io) - Budget tier

**Optional:**
- [Meta Developers](https://developers.facebook.com) - Instagram
- [Late.dev](https://getlate.dev) - TikTok/YouTube

### Step 2: Deploy to Vercel

1. **Push to GitHub** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Add environment variables (see `.env.example`)
   - Click Deploy!

3. **Set up database**
   - Create Vercel Postgres database
   - Copy `DATABASE_URL` to environment variables
   - Redeploy to run migrations

### Step 3: Complete Onboarding

Visit your deployed URL and complete the 5-step onboarding wizard. You're ready to start creating! 🎉

## 💻 Local Development (Optional)

Want to develop locally first?

```bash
# Clone the repository
git clone your-github-repo
cd ai-creator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Set up the database
npx prisma db push
npx prisma generate

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🔑 Environment Variables

### Required (Core Functionality)

```bash
# Database (Vercel Postgres or any PostgreSQL)
DATABASE_URL="postgresql://..."

# AI Services (for content creation)
ANTHROPIC_API_KEY="sk-ant-..."        # Get from https://console.anthropic.com
OPENAI_API_KEY="sk-..."               # Get from https://platform.openai.com

# Payments (for monetization)
STRIPE_SECRET_KEY="sk_live_..."       # Get from https://dashboard.stripe.com
STRIPE_WEBHOOK_SECRET="whsec_..."     # For webhook handling

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### Video Generation (Choose ONE tier)

**Premium Tier - Arcads AI**
```bash
ARCADS_CLIENT_ID="your-client-id"
ARCADS_CLIENT_SECRET="your-client-secret"
```
Get from: https://www.arcads.ai

**Standard Tier - HeyGen** (Recommended)
```bash
HEYGEN_API_KEY="your-api-key"
```
Get from: https://heygen.com

**Budget Tier - Kling + ElevenLabs**
```bash
KLING_ACCESS_KEY="your-access-key"
KLING_SECRET_KEY="your-secret-key"
ELEVENLABS_API_KEY="your-api-key"
```
Get from: https://klingai.com and https://elevenlabs.io

### Social Media (Optional)

**Instagram (Direct API)**
```bash
META_APP_ID="your-app-id"
META_APP_SECRET="your-app-secret"
```
Get from: https://developers.facebook.com

**TikTok & YouTube (via Late.dev)**
```bash
LATE_API_KEY="your-api-key"
```
Get from: https://getlate.dev

**ManyChat (Comment-to-DM automation)**
```bash
MANYCHAT_API_TOKEN="your-token"
```
Get from: https://manychat.com

### Additional Services

```bash
# Google AI (for image generation)
GOOGLE_AI_API_KEY="your-api-key"      # Get from https://aistudio.google.com
```

## 📁 Project Structure

```
ai-creator/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── landing/           # Marketing landing page
│   │   └── (dashboard)/       # Protected dashboard routes
│   ├── components/            # React components
│   │   ├── onboarding/       # Onboarding wizard
│   │   ├── layout/           # Layout components
│   │   ├── shared/           # Shared components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utilities & services
│   │   ├── services/         # API wrappers (HeyGen, Late.dev, etc.)
│   │   ├── hooks/            # React hooks
│   │   └── prisma.ts         # Prisma client
│   └── generated/
│       └── prisma/           # Generated Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
└── public/                    # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (React 19, TypeScript)
- **Database**: PostgreSQL + Prisma 7 ORM
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Animations**: Framer Motion
- **State**: React Query (@tanstack/react-query)
- **Deployment**: Vercel
- **Payments**: Stripe
- **AI Services**: Anthropic, OpenAI, HeyGen, ElevenLabs

## 📖 Documentation

### Onboarding Wizard

First-time users are guided through a 5-step onboarding wizard:

1. **Welcome** - Introduction to the platform
2. **AI Services** - Connect your video generation tier
3. **Social Accounts** - Link Instagram, TikTok, YouTube
4. **Payments** - Set up Stripe for monetization
5. **Ready** - Complete setup and start creating

### Creating Content

1. Navigate to **Personas** → Create a new persona
2. Go to **Content** → Generate new video
3. Choose your AI services and create
4. Post to social media from the content dashboard

### Setting Up Campaigns

1. Go to **Campaigns** → Create campaign
2. Link to a product and ManyChat keyword
3. Generate campaign content
4. Post to Instagram/TikTok
5. Track conversions in Analytics

### Managing Products

1. Navigate to **Products**
2. Create product with Stripe price ID
3. Add product to campaigns
4. Track sales in Analytics dashboard

## 🎯 Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables in Vercel
- [ ] Configure Stripe webhook endpoint
- [ ] Set up Meta App for Instagram API
- [ ] Connect Late.dev for TikTok/YouTube (optional)
- [ ] Test onboarding flow end-to-end
- [ ] Verify video generation works
- [ ] Test social media posting
- [ ] Confirm payment flow with Stripe test mode
- [ ] Switch Stripe to live mode
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use environment variables for all API keys
- Enable Stripe webhook signing for production
- Set proper CORS origins for Meta Graph API
- Use strong passwords for database
- Enable Vercel's Authentication if needed

## 💡 Tips & Best Practices

### Video Generation
- Start with HeyGen (Standard tier) - best quality-to-cost ratio
- Use test mode in HeyGen to avoid watermarks in dev
- Videos generate in 9:16 aspect ratio (optimized for Reels/TikTok/Stories)

### Social Media
- Instagram requires Business/Creator account linked to Facebook Page
- TikTok posting requires Late.dev Pro subscription
- YouTube uploads work best with public/unlisted privacy

### Monetization
- Use ManyChat Pro ($15/mo) for comment-to-DM automation
- Create Stripe products first, then link to campaigns
- Track keyword usage in ManyChat to measure campaign ROI

### Performance
- Prisma client is cached for optimal performance
- React Query caches API responses with smart invalidation
- Images are optimized with Next.js Image component

## 🆘 Support

Need help? We're here for you:

- **Email**: support@yourdomain.com
- **Response Time**: 24-48 hours
- **Documentation**: See this README and `.env.example`

### Common Issues

**Problem**: "Database connection failed"
- **Solution**: Check `DATABASE_URL` in Vercel environment variables
- Make sure Vercel Postgres is created and connected

**Problem**: "API key invalid"
- **Solution**: Verify key format in `.env.example`
- Check if using test vs live keys (Stripe)
- Restart dev server after changing env vars

**Problem**: "Deployment failed"
- **Solution**: Check build logs in Vercel dashboard
- Ensure all required env vars are set
- Run `npm run build` locally to test

## 📄 License

This is a commercial product. You have a license to:
- ✅ Use for unlimited personal/client projects
- ✅ Modify and customize as needed
- ✅ Deploy to unlimited domains
- ❌ Resell or redistribute the source code
- ❌ Create competing template products

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [HeyGen](https://heygen.com)
- [Anthropic](https://anthropic.com)
- [OpenAI](https://openai.com)
- [Stripe](https://stripe.com)

---

**Made with ❤️ for creators who want to make money with AI**

Questions? Email support@yourdomain.com • Response time: 24-48 hours
