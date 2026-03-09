# AI Creator Studio - Complete Build Specification

**Project:** AI Creator Studio  
**Tagline:** "Download. Create. Profit."  
**Target Price:** $197 one-time purchase  
**Tech Stack:** Next.js 16, React 19, Prisma, PostgreSQL, Tailwind CSS 4, shadcn/ui, Framer Motion

---

## 📋 CURRENT STATE ANALYSIS

### Existing Structure
```
src/
├── app/
│   ├── page.tsx                    ✅ Dashboard with KPIs, analytics
│   ├── layout.tsx                  ✅ Root layout with Sidebar
│   ├── settings/page.tsx           ✅ Settings tabs (APIs, Social, ManyChat, App)
│   ├── personas/                   ✅ Persona management
│   ├── content/                    ✅ Content pipeline
│   ├── products/                   ✅ Product/order management
│   └── api/                        ✅ Full API routes
├── components/
│   ├── ui/                         ✅ shadcn components
│   ├── layout/                     ✅ Sidebar, TopBar
│   └── shared/                     ✅ KPICard, StatusBadge, EmptyState
├── lib/
│   ├── hooks.ts                    ✅ React Query hooks
│   ├── prisma.ts                   ✅ Database client
│   ├── storage.ts                  ✅ File storage utils
│   ├── engines/                    ✅ Content pipeline, persona builder
│   └── services/                   ✅ All AI/social integrations
└── generated/prisma/               ✅ Prisma client (output dir)
```

### Database Schema
- ✅ AIPersona, ContentPiece, Campaign, Product, Order
- ✅ SocialAccount, GenerationJob, Setting
- ✅ Complete enums for status tracking

### Dependencies Installed
- ✅ Next.js 16.1.6, React 19.2.3
- ✅ Prisma 7.4.2, @tanstack/react-query 5.90.21
- ✅ shadcn/ui components (via Radix UI)
- ✅ next-themes 0.4.6, date-fns, lucide-react, sonner
- ✅ Anthropic SDK, OpenAI SDK, Stripe
- ⚠️ **MISSING:** Framer Motion (for wizard animations)

---

## 🚀 PHASE 1: GET IT RUNNING (Critical Path)

### 1.1 Install Missing Dependencies

```bash
cd /Users/nickdowning/ai-creator
npm install framer-motion
```

### 1.2 Set Up Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add at minimum:
```env
DATABASE_URL="postgresql://localhost:5432/ai_creator"
POSTGRES_PRISMA_URL="postgresql://localhost:5432/ai_creator"
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Note:** Other API keys are optional for initial boot. The app should gracefully handle missing keys.

### 1.3 Database Setup

**Prerequisites:**
- PostgreSQL 14+ running locally or via Docker
- Database named `ai_creator` created

**Commands:**
```bash
# If using Docker (recommended):
docker run -d \
  --name ai-creator-db \
  -e POSTGRES_DB=ai_creator \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Optional: seed with sample data
npx prisma db seed  # (if seed script exists)
```

**If migrations fail:**
```bash
# Reset database and try again
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

### 1.4 Boot the Application

```bash
npm run dev
```

Expected output:
```
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Ready in 2.3s
```

**Note:** Default port is 3000, but can be overridden with:
```bash
npm run dev -- -p 3001
```

### 1.5 Verify Pages Load

Open browser and test:
- `http://localhost:3000/` → Dashboard (should show 0s for all KPIs)
- `http://localhost:3000/settings` → Settings page
- `http://localhost:3000/personas` → Personas list (empty)
- `http://localhost:3000/content` → Content list (empty)
- `http://localhost:3000/products` → Products list (empty)

**If any page errors:**
1. Check browser console for errors
2. Check terminal for server-side errors
3. Verify Prisma client is generated: `npx prisma generate`
4. Restart dev server

---

## 🎯 PHASE 2: ONBOARDING WIZARD (First-Run Experience)

### 2.1 Overview

**Goal:** Build a beautiful multi-step wizard that appears on first launch when no API keys are configured. Think Notion/Linear onboarding — premium, not intimidating.

**Design Principles:**
- Dark mode default with premium feel
- Progress bar at top showing 5 steps
- Smooth animations between steps (Framer Motion)
- "Skip for now" button always visible (bottom left)
- Large, friendly copy with emoji touches
- Direct signup links for each service
- Free tier callouts where applicable

### 2.2 Implementation Steps

#### Step 1: Create Onboarding Hook

**File:** `src/lib/hooks/useOnboarding.ts`

```typescript
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export function useOnboarding() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    },
  });

  const hasCompletedOnboarding = settings?.onboardingCompleted ?? false;

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'onboardingCompleted', value: true }),
      });
      return res.json();
    },
  });

  return {
    hasCompletedOnboarding,
    completeOnboarding: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
  };
}
```

#### Step 2: Update Settings API to Support Onboarding Flag

**File:** `src/app/api/settings/route.ts`

Add a GET handler that checks for `onboardingCompleted` setting:

```typescript
// Add to existing route.ts
export async function GET() {
  const setting = await prisma.setting.findUnique({
    where: { key: 'onboardingCompleted' },
  });

  return Response.json({
    onboardingCompleted: setting?.value ?? false,
  });
}
```

Update POST to handle setting creation:

```typescript
export async function POST(request: Request) {
  const { key, value } = await request.json();

  const setting = await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  return Response.json(setting);
}
```

#### Step 3: Create Wizard Components

**File:** `src/components/onboarding/OnboardingWizard.tsx`

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIServicesStep } from "./steps/AIServicesStep";
import { SocialStep } from "./steps/SocialStep";
import { PaymentsStep } from "./steps/PaymentsStep";
import { ReadyStep } from "./steps/ReadyStep";

const STEPS = [
  { id: 'welcome', component: WelcomeStep, title: 'Welcome' },
  { id: 'ai', component: AIServicesStep, title: 'AI Services' },
  { id: 'social', component: SocialStep, title: 'Social' },
  { id: 'payments', component: PaymentsStep, title: 'Payments' },
  { id: 'ready', component: ReadyStep, title: 'Ready!' },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding, isCompleting } = useOnboarding();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleFinish = () => {
    completeOnboarding();
  };

  const StepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1">
        <Progress value={progress} className="h-full rounded-none" />
      </div>

      {/* Skip button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkip}
        disabled={isCompleting}
        className="absolute top-4 right-4"
      >
        <X className="h-4 w-4 mr-2" />
        Skip for now
      </Button>

      {/* Step indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`h-2 w-2 rounded-full transition-colors ${
              idx === currentStep
                ? 'bg-purple-500'
                : idx < currentStep
                ? 'bg-purple-300'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StepComponent
              onNext={handleNext}
              onBack={handleBack}
              onFinish={handleFinish}
              isFirst={currentStep === 0}
              isLast={currentStep === STEPS.length - 1}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

#### Step 4: Create Individual Step Components

**File:** `src/components/onboarding/steps/WelcomeStep.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
        <Sparkles className="h-10 w-10 text-white" />
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Welcome to AI Creator Studio
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          Your all-in-one platform for creating AI-generated content, building digital personas, and scaling your creator business.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-md mx-auto text-left text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎭</span>
          <div>
            <strong className="text-foreground">Create AI Personas</strong> — Voice-cloned, video-enabled digital creators
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <strong className="text-foreground">Generate Content</strong> — Scripts, voiceovers, videos, all automated
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <strong className="text-foreground">Sell Products</strong> — Integrated Stripe checkout & ManyChat automation
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="px-8">
        Let's Get Started →
      </Button>
    </div>
  );
}
```

**File:** `src/components/onboarding/steps/AIServicesStep.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Zap, CheckCircle } from "lucide-react";
import { useState } from "react";

export function AIServicesStep({ onNext, onBack }: any) {
  const [keys, setKeys] = useState({
    elevenlabs: '',
    kling: '',
    heygen: '',
    arcads: '',
  });

  const services = [
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      description: 'AI voice generation & voice design',
      freeTier: '10,000 chars/month free',
      signupUrl: 'https://elevenlabs.io',
      emoji: '🎙️',
    },
    {
      id: 'kling',
      name: 'Kling AI',
      description: 'Cinematic video generation',
      freeTier: '66 credits free on signup',
      signupUrl: 'https://klingai.com',
      emoji: '🎬',
    },
    {
      id: 'heygen',
      name: 'HeyGen',
      description: 'AI avatar videos (alternative to Kling)',
      freeTier: '1 min/month free',
      signupUrl: 'https://heygen.com',
      emoji: '🎭',
    },
    {
      id: 'arcads',
      name: 'Arcads AI',
      description: 'UGC-style AI videos (optional)',
      freeTier: 'Pay-per-use',
      signupUrl: 'https://arcads.ai',
      emoji: '📹',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Connect AI Services</h2>
        <p className="text-muted-foreground">
          These services power your content generation. Sign up for free tiers first!
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{service.emoji}</span>
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="text-xs">{service.description}</CardDescription>
                  </div>
                </div>
                <a href={service.signupUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Sign Up
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Zap className="h-3 w-3" />
                  {service.freeTier}
                </div>
                <div>
                  <Label htmlFor={service.id} className="text-xs">API Key (paste after signup)</Label>
                  <Input
                    id={service.id}
                    placeholder="sk-..."
                    value={keys[service.id as keyof typeof keys]}
                    onChange={(e) => setKeys({ ...keys, [service.id]: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>
          Continue →
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        💡 Don't have keys yet? No worries — you can add them later in Settings.
      </p>
    </div>
  );
}
```

**File:** `src/components/onboarding/steps/SocialStep.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, ExternalLink } from "lucide-react";

export function SocialStep({ onNext, onBack }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Connect Social Accounts</h2>
        <p className="text-muted-foreground">
          Link your Instagram to start publishing AI-generated content
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Instagram className="h-8 w-8 text-pink-500" />
            <div>
              <CardTitle>Instagram Business</CardTitle>
              <CardDescription>Direct posting via Meta Graph API</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <a href="/api/auth/instagram">
            <Button className="w-full" size="lg">
              <Instagram className="h-4 w-4 mr-2" />
              Connect Instagram Account
            </Button>
          </a>

          <div className="text-xs space-y-2 text-muted-foreground">
            <p className="font-medium text-foreground">Prerequisites:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Instagram must be a <strong>Business</strong> or <strong>Creator</strong> account</li>
              <li>Instagram must be linked to a Facebook Page</li>
              <li>You'll need to set up a Meta App (we'll guide you in Settings)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TikTok & YouTube (via Late.dev)</CardTitle>
          <CardDescription className="text-xs">Optional — coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="https://getlate.dev" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-2" />
              Learn More
            </Button>
          </a>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
```

**File:** `src/components/onboarding/steps/PaymentsStep.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CreditCard, DollarSign } from "lucide-react";
import { useState } from "react";

export function PaymentsStep({ onNext, onBack }: any) {
  const [stripeKey, setStripeKey] = useState('');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Set Up Payments</h2>
        <p className="text-muted-foreground">
          Connect Stripe to accept payments for your digital products
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Stripe</CardTitle>
              <CardDescription>Accept payments globally</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stripe">Stripe Secret Key</Label>
            <Input
              id="stripe"
              type="password"
              placeholder="sk_test_..."
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a>
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <DollarSign className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-foreground">Why Stripe?</p>
              <p className="text-muted-foreground">
                Stripe handles all payment processing, subscriptions, and customer management. 
                Integrates seamlessly with ManyChat for automated sales funnels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>
          Continue →
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can set this up later in Settings if you're not ready yet
      </p>
    </div>
  );
}
```

**File:** `src/components/onboarding/steps/ReadyStep.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Rocket } from "lucide-react";
import Link from "next/link";

export function ReadyStep({ onFinish }: any) {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-bold">You're All Set!</h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          AI Creator Studio is ready to help you build, scale, and monetize your AI content empire.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card text-left">
          <Sparkles className="h-6 w-6 text-purple-500 shrink-0" />
          <div className="text-sm">
            <strong className="text-foreground">Next Step:</strong> Create your first AI persona
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card text-left">
          <Rocket className="h-6 w-6 text-blue-500 shrink-0" />
          <div className="text-sm">
            <strong className="text-foreground">Pro Tip:</strong> Start with a simple niche (e.g., fitness tips, cooking hacks)
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Link href="/personas/new">
          <Button size="lg" className="w-full max-w-xs px-8" onClick={onFinish}>
            Create Your First Persona →
          </Button>
        </Link>
        <Button variant="ghost" onClick={onFinish}>
          Take me to the dashboard
        </Button>
      </div>
    </div>
  );
}
```

#### Step 5: Integrate Wizard into Root Layout

**File:** `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { OnboardingGuard } from "@/components/onboarding/OnboardingGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Creator Studio",
  description: "Download. Create. Profit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <OnboardingGuard>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-64">{children}</main>
            </div>
          </OnboardingGuard>
        </Providers>
      </body>
    </html>
  );
}
```

**File:** `src/components/onboarding/OnboardingGuard.tsx`

```typescript
"use client";

import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { OnboardingWizard } from "./OnboardingWizard";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding } = useOnboarding();

  if (hasCompletedOnboarding === false) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
}
```

#### Step 6: Add "Run Onboarding Again" Option in Settings

**File:** `src/app/settings/page.tsx`

Add a button in the "Application" tab:

```typescript
// Inside the Application TabsContent, add:
<Card>
  <CardHeader>
    <CardTitle>Onboarding</CardTitle>
    <CardDescription>
      Re-run the setup wizard if you skipped it or want to review
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button
      variant="outline"
      onClick={async () => {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'onboardingCompleted', value: false }),
        });
        window.location.reload();
      }}
    >
      Run Onboarding Again
    </Button>
  </CardContent>
</Card>
```

---

## 🎨 PHASE 3: BRANDING & UI POLISH

### 3.1 Color System & Design Tokens

**File:** `src/app/globals.css`

Update the CSS variables to include the new color palette:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 10 10 10; /* #0a0a0a - deep dark */
    --foreground: 250 250 250;
    
    --card: 15 15 15;
    --card-foreground: 250 250 250;
    
    --popover: 15 15 15;
    --popover-foreground: 250 250 250;
    
    --primary: 139 92 246; /* #8b5cf6 - purple */
    --primary-foreground: 255 255 255;
    
    --secondary: 59 130 246; /* #3b82f6 - blue */
    --secondary-foreground: 255 255 255;
    
    --muted: 30 30 30;
    --muted-foreground: 161 161 170;
    
    --accent: 139 92 246; /* purple accent */
    --accent-foreground: 255 255 255;
    
    --destructive: 239 68 68;
    --destructive-foreground: 255 255 255;
    
    --border: 30 30 30;
    --input: 30 30 30;
    --ring: 139 92 246;
    
    --radius: 0.5rem;
    
    /* Custom semantic colors */
    --success: 34 197 94; /* #22c55e - green */
    --warning: 245 158 11; /* #f59e0b - amber */
    --info: 59 130 246; /* #3b82f6 - blue */
  }
}

/* Gradient backgrounds for premium feel */
.gradient-purple-blue {
  background: linear-gradient(135deg, rgb(139 92 246) 0%, rgb(59 130 246) 100%);
}

.gradient-green {
  background: linear-gradient(135deg, rgb(34 197 94) 0%, rgb(16 185 129) 100%);
}

/* Subtle glass morphism effect */
.glass {
  background: rgba(15, 15, 15, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Smooth animations */
* {
  @apply transition-colors duration-200;
}
```

### 3.2 Update Sidebar with Branding

**File:** `src/components/layout/sidebar.tsx`

Add app name and logo placeholder at the top:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Film,
  Megaphone,
  Package,
  Settings,
  Sparkles,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Content", href: "/content", icon: Film },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Products", href: "/products", icon: Package },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
      {/* Logo & Branding */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-border">
        <div className="h-10 w-10 rounded-lg gradient-purple-blue flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg">AI Creator Studio</h1>
          <p className="text-xs text-muted-foreground">Create. Profit.</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

### 3.3 Enhance Dashboard with Premium Cards

**File:** `src/components/shared/kpi-card.tsx`

Add gradient backgrounds and micro-animations:

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  gradient?: boolean;
}

export function KPICard({ title, value, description, icon: Icon, gradient }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className={gradient ? "gradient-purple-blue text-white border-0" : ""}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className={`text-xs ${gradient ? "text-white/70" : "text-muted-foreground"} mt-1`}>
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

Update dashboard to use gradient on first KPI:

```typescript
// In src/app/page.tsx, modify the first KPICard:
<KPICard
  title="Active Personas"
  value={analytics?.personas.active ?? 0}
  description={`${analytics?.personas.total ?? 0} total`}
  icon={Users}
  gradient={true}
/>
```

### 3.4 Enhanced Status Badges

**File:** `src/components/shared/status-badge.tsx`

Add color-coded status system:

```typescript
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from "lucide-react";

const statusConfig = {
  // Pipeline statuses
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: null },
  READY: { label: "Ready", color: "bg-green-100 text-green-700", icon: CheckCircle },
  GENERATING: { label: "Generating", color: "bg-yellow-100 text-yellow-700", icon: Loader2 },
  PROCESSING: { label: "Processing", color: "bg-yellow-100 text-yellow-700", icon: Loader2 },
  SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: Clock },
  PUBLISHED: { label: "Published", color: "bg-green-100 text-green-700", icon: CheckCircle },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700", icon: XCircle },

  // Job types
  VOICE: { label: "Voice", color: "bg-purple-100 text-purple-700", icon: null },
  VIDEO_KLING: { label: "Video (Kling)", color: "bg-blue-100 text-blue-700", icon: null },
  VIDEO_HEYGEN: { label: "Video (HeyGen)", color: "bg-blue-100 text-blue-700", icon: null },
  VIDEO_ARCADS: { label: "Video (Arcads)", color: "bg-blue-100 text-blue-700", icon: null },
  IMAGE: { label: "Image", color: "bg-cyan-100 text-cyan-700", icon: null },

  // Platforms
  INSTAGRAM: { label: "Instagram", color: "bg-pink-100 text-pink-700", icon: null },
  TIKTOK: { label: "TikTok", color: "bg-black text-white", icon: null },
  YOUTUBE: { label: "YouTube", color: "bg-red-100 text-red-700", icon: null },

  // Defaults
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  QUEUED: { label: "Queued", color: "bg-gray-100 text-gray-700", icon: Clock },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: "bg-gray-100 text-gray-700",
    icon: null,
  };

  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={`${config.color} gap-1 text-xs`}>
      {Icon && <Icon className={`h-3 w-3 ${status === "GENERATING" || status === "PROCESSING" ? "animate-spin" : ""}`} />}
      {config.label}
    </Badge>
  );
}
```

### 3.5 Content Pipeline Visualization

**File:** `src/components/shared/PipelineFlow.tsx`

Create a visual content pipeline component:

```typescript
"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PipelineFlowProps {
  currentStage: "DRAFT" | "SCRIPT_READY" | "VOICE_GENERATING" | "VIDEO_GENERATING" | "READY" | "PUBLISHED";
}

const stages = [
  { id: "DRAFT", label: "Script" },
  { id: "SCRIPT_READY", label: "Voice" },
  { id: "VOICE_GENERATING", label: "Video" },
  { id: "VIDEO_GENERATING", label: "Publish" },
  { id: "READY", label: "Ready" },
];

export function PipelineFlow({ currentStage }: PipelineFlowProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex items-center justify-between py-4">
      {stages.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center
                  ${isCompleted ? "bg-green-500 text-white" : ""}
                  ${isCurrent ? "bg-purple-500 text-white" : ""}
                  ${isFuture ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {isCompleted && <CheckCircle className="h-5 w-5" />}
                {isCurrent && <Loader2 className="h-5 w-5 animate-spin" />}
                {isFuture && <Circle className="h-5 w-5" />}
              </motion.div>
              <span className={`text-xs font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {stage.label}
              </span>
            </div>

            {index < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-muted">
                {isCompleted && (
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    className="h-full bg-green-500"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

Use this component in content detail pages:

```typescript
// In src/app/content/[id]/page.tsx
import { PipelineFlow } from "@/components/shared/PipelineFlow";

// Inside the component:
<Card>
  <CardHeader>
    <CardTitle>Content Pipeline</CardTitle>
  </CardHeader>
  <CardContent>
    <PipelineFlow currentStage={content.status} />
  </CardContent>
</Card>
```

---

## 🚀 PHASE 4: DEPLOY TO VERCEL (One-Click)

### 4.1 Create Vercel Configuration

**File:** `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "POSTGRES_PRISMA_URL": "@postgres_prisma_url",
    "NEXT_PUBLIC_APP_URL": "@app_url"
  }
}
```

### 4.2 Add Vercel Postgres Integration

Update `package.json` to add a postinstall script:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint",
    "postinstall": "prisma generate"
  }
}
```

### 4.3 Update README for Deployment

**File:** `README.md`

```markdown
# AI Creator Studio

**Tagline:** Download. Create. Profit.

AI Creator Studio is a complete platform for creating AI-generated content, building digital personas, and monetizing through integrated sales funnels.

## Features

- 🎭 **AI Persona Builder** — Create voice-cloned, video-enabled digital creators
- 🎬 **Automated Content Pipeline** — Scripts → Voice → Video → Publish
- 📱 **Direct Instagram Integration** — Post directly via Meta Graph API
- 💰 **Stripe Checkout** — Sell digital products with one-click payments
- 🤖 **ManyChat Integration** — Comment-to-DM automation for sales
- 🎨 **Premium Dark UI** — Modern, polished interface inspired by Linear & Raycast

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **AI Services:** ElevenLabs (voice), Kling AI (video), HeyGen, Arcads
- **Integrations:** Meta Graph API, Late.dev, ManyChat, Stripe

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fai-creator-studio&env=DATABASE_URL,ANTHROPIC_API_KEY,ELEVENLABS_API_KEY,STRIPE_SECRET_KEY&envDescription=Required%20API%20keys%20for%20AI%20Creator%20Studio&project-name=ai-creator-studio&repository-name=ai-creator-studio)

### Environment Variables Required

The following environment variables are **required** for deployment:

```env
# Database (Vercel Postgres)
DATABASE_URL=
POSTGRES_PRISMA_URL=

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Required AI Services
ANTHROPIC_API_KEY=      # For script generation
ELEVENLABS_API_KEY=     # For voice generation
KLING_API_KEY=          # For video generation

# Required for Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Optional Services
GOOGLE_AI_API_KEY=      # For image generation (Nano Banana)
HEYGEN_API_KEY=         # Alternative video service
ARCADS_CLIENT_ID=       # UGC-style videos
ARCADS_CLIENT_SECRET=
LATE_API_KEY=           # For TikTok/YouTube
MANYCHAT_API_TOKEN=     # For comment automation
META_APP_ID=            # For Instagram OAuth
META_APP_SECRET=
OPENAI_API_KEY=         # For image analysis
```

### Manual Deployment Steps

1. **Fork/Clone this repo**
2. **Create a Vercel project** and link your repo
3. **Add Vercel Postgres** (Storage > Postgres > Create)
4. **Set environment variables** in Vercel dashboard
5. **Deploy!** Vercel will automatically run migrations

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys

# Start PostgreSQL (via Docker)
docker run -d \
  --name ai-creator-db \
  -e POSTGRES_DB=ai_creator \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Getting API Keys

### Free Tiers Available

- **ElevenLabs:** 10,000 characters/month free → [Sign up](https://elevenlabs.io)
- **Kling AI:** 66 credits free on signup → [Sign up](https://klingai.com)
- **HeyGen:** 1 minute/month free → [Sign up](https://heygen.com)
- **Anthropic:** $5 free credit → [Sign up](https://console.anthropic.com)
- **Stripe:** Free forever (2.9% + 30¢ per transaction) → [Sign up](https://stripe.com)

### Paid Services

- **ManyChat:** $15/month for Pro (required for comment automation) → [Sign up](https://manychat.com)
- **Late.dev:** Starts at $9/month (only needed for TikTok/YouTube) → [Sign up](https://getlate.dev)

## License

Proprietary — For purchase only. See [Whop listing](#) for details.

## Support

Questions? Email: support@aicreatostudio.com
```

### 4.4 Create Deploy Guide

**File:** `docs/deploy-guide.md`

```markdown
# Deployment Guide

## Option 1: Vercel (Recommended)

### Step 1: Prepare Your Repository

1. Push your code to GitHub (private repo recommended for commercial use)
2. Make sure `.env` is in `.gitignore` (it is by default)

### Step 2: Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### Step 3: Add Vercel Postgres

1. In your project dashboard, go to **Storage**
2. Click **Create Database** → Select **Postgres**
3. Choose a region (recommend same as your app)
4. Vercel will automatically add `DATABASE_URL` and `POSTGRES_PRISMA_URL` to your environment variables

### Step 4: Configure Environment Variables

In **Settings** → **Environment Variables**, add:

**Required:**
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
KLING_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Optional (add as needed):**
```
META_APP_ID=...
META_APP_SECRET=...
GOOGLE_AI_API_KEY=...
HEYGEN_API_KEY=...
ARCADS_CLIENT_ID=...
ARCADS_CLIENT_SECRET=...
LATE_API_KEY=...
MANYCHAT_API_TOKEN=...
OPENAI_API_KEY=...
```

### Step 5: Deploy

1. Click **Deploy**
2. Vercel will run `npm install`, `prisma generate`, and `next build`
3. Once deployed, click **Visit** to open your app
4. The onboarding wizard will guide you through setup

### Step 6: Run Database Migrations

Vercel doesn't run migrations automatically. You'll need to:

**Option A: Use Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Use Prisma Data Platform** (easier)
1. Sign up at [prisma.io/data-platform](https://prisma.io/data-platform)
2. Connect your database
3. Run migrations via the UI

### Step 7: Set Up Webhooks

**Stripe Webhooks:**
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel

**Instagram Webhooks (if using Direct API):**
1. In Meta App settings, configure webhook URL: `https://your-app.vercel.app/api/webhooks/instagram`
2. Subscribe to `feed`, `mentions`, `messages` topics

---

## Option 2: Railway

Railway is an alternative to Vercel with simpler database setup.

1. Go to [railway.app](https://railway.app)
2. Create new project → **Deploy from GitHub**
3. Add PostgreSQL service (Railway will auto-configure `DATABASE_URL`)
4. Add environment variables
5. Deploy

---

## Option 3: Self-Hosted (Docker)

Coming soon — see `docker-compose.yml` in repo root.

---

## Post-Deployment Checklist

- [ ] App loads at your domain
- [ ] Onboarding wizard appears on first visit
- [ ] Database migrations applied (check Prisma Studio)
- [ ] Stripe webhook endpoint verified
- [ ] Instagram OAuth flow tested
- [ ] Test creating a persona
- [ ] Test generating content
- [ ] Test publishing to Instagram

---

## Troubleshooting

### "Cannot find module '@prisma/client'"
Run: `npx prisma generate` in your Vercel project settings under **Build Command**

### Database connection errors
Make sure `DATABASE_URL` and `POSTGRES_PRISMA_URL` are set correctly in environment variables.

### Stripe webhook 401 errors
Your `STRIPE_WEBHOOK_SECRET` is incorrect. Get the correct signing secret from Stripe dashboard.

### Instagram OAuth redirect errors
Make sure `NEXT_PUBLIC_APP_URL` is set to your production domain (not localhost).
```

---

## 💰 PHASE 5: WHOP INTEGRATION & SALES FUNNEL

### 5.1 Whop Product Setup Guide

**File:** `docs/whop-setup.md`

```markdown
# How to Sell on Whop

[Whop](https://whop.com) is a platform for selling digital products, courses, and software. Perfect for selling AI Creator Studio.

## Why Whop?

- ✅ Handles payments via Stripe (they take ~3-5%)
- ✅ Built-in affiliate program
- ✅ Software licensing/access management
- ✅ Discord integration for community
- ✅ One-click checkout experience

## Setup Steps

### 1. Create Your Whop Account

1. Go to [whop.com/sell](https://whop.com/sell)
2. Sign up as a seller
3. Complete identity verification (required for payouts)

### 2. Create Your Product

**Product Type:** Choose **Software/Tool**

**Pricing:**
- **Recommended:** $197 one-time payment
- **Alternative:** $97 (lifetime) + $29/month for updates/support

**Product Details:**
```
Name: AI Creator Studio - Lifetime Access
Tagline: Build AI Content Creators & Automate Your Sales
Description:
  
  Get lifetime access to AI Creator Studio — the complete platform for creating 
  AI-generated content and scaling your creator business.

  ✅ Unlimited AI Personas
  ✅ Automated content generation (voice + video)
  ✅ Direct Instagram posting
  ✅ ManyChat sales funnel templates
  ✅ Stripe checkout integration
  ✅ Lifetime updates

  Requirements:
  - API keys for AI services (free tiers available)
  - Instagram Business account
  - Stripe account

  One-time payment. No monthly fees.
```

**Access Method:** Choose **GitHub Repository Access**
- Link your private GitHub repo
- Whop will automatically grant access to buyers
- Or provide a download link for a ZIP file

### 3. Set Up Your Checkout Page

Whop generates a checkout URL like: `https://whop.com/ai-creator-studio`

**Customize it:**
- Add screenshots (dashboard, persona builder, content pipeline)
- Add testimonials (if you have any)
- Add FAQ section
- Highlight free trial APIs (ElevenLabs, Kling, etc.)

### 4. Enable Affiliates (Optional)

Whop has built-in affiliate system:
- Set commission: 20-30% recommended
- Affiliates get unique referral links
- Whop handles payouts

### 5. Launch!

Share your Whop link:
- In Instagram bio
- In ManyChat DM automation
- On Twitter/X
- In relevant communities (Reddit, Discord)

---

## ManyChat Sales Funnel

This is the key to automating sales from Instagram content.

### How It Works

1. You post a reel: "Comment 'AI' to get my creator tool"
2. User comments "AI"
3. ManyChat detects keyword → auto-sends DM
4. DM contains: "Here's the tool! 👉 [Whop checkout link]"
5. User clicks → buys → gets GitHub access automatically

### ManyChat Setup

**Step 1: Connect Instagram to ManyChat**
1. Sign up for [ManyChat Pro](https://manychat.com/pricing) ($15/mo)
2. Connect your Instagram Business account
3. Grant all permissions

**Step 2: Create Keyword Automation**
1. Go to **Automation** → **Keywords**
2. Click **New Keyword**
3. Set trigger: `AI` (or `LINK`, `FREE`, `TOOL`, etc.)
4. Set action: **Send Message**

**Step 3: Design Your DM**

```
Hey! 👋 Here's the AI Creator Studio you asked about.

It's the complete toolkit for building AI content creators and automating your sales.

✅ AI-generated voices & videos
✅ Instagram auto-posting
✅ Built-in sales funnels
✅ $197 one-time (no monthly fees)

Grab it here: [Whop checkout link]

Questions? Just reply to this message!
```

**Pro Tips:**
- Use emojis (Instagram loves them)
- Keep it short (DMs have character limits)
- Add urgency: "Only 50 spots left this month"
- Offer bonuses: "+ Free bonus: ManyChat templates"

**Step 4: Track in Campaign**

In AI Creator Studio:
1. Create a Campaign for this funnel
2. Set `manychatKeyword` to "AI"
3. Track orders that mention this keyword

---

## Revenue Tracking

Orders from ManyChat → Stripe → Your database

**Flow:**
1. User clicks Whop link
2. Whop redirects to Stripe checkout
3. After payment, Stripe webhook hits your app: `/api/webhooks/stripe`
4. Your app creates an `Order` record
5. Dashboard shows revenue

To attribute orders to campaigns:
- Add `?ref=campaign-{id}` to your Whop links
- Parse `ref` param in webhook handler
- Link order to campaign

---

## Pricing Strategy

**Option 1: Low Barrier ($97)**
- Attracts more buyers
- Great for testing market
- Can upsell support/community

**Option 2: Premium ($197)**
- Higher perceived value
- Attracts serious buyers
- Better margins per sale

**Option 3: Tiered**
- Starter: $97 (basic features)
- Pro: $197 (everything + support)
- Agency: $497 (multi-user + white-label)

**Recommendation:** Start with $197. It's the sweet spot for a B2C SaaS tool.

---

## Alternative: Gumroad

If you don't want to use Whop, [Gumroad](https://gumroad.com) is simpler:
- Create product
- Upload ZIP file of codebase
- Set price
- Get payment link

**Downsides:**
- No GitHub integration (manual access control)
- No affiliate program
- Higher fees (10% + payment processing)

**Whop is better for software.**
```

### 5.2 Update Settings Page with Whop Link

**File:** `src/app/settings/page.tsx`

Add a new tab for "Sales & Distribution":

```typescript
<TabsList>
  <TabsTrigger value="apis">API Keys</TabsTrigger>
  <TabsTrigger value="social">Social Accounts</TabsTrigger>
  <TabsTrigger value="manychat">ManyChat</TabsTrigger>
  <TabsTrigger value="sales">Sales</TabsTrigger>
  <TabsTrigger value="app">Application</TabsTrigger>
</TabsList>

{/* Sales Tab */}
<TabsContent value="sales" className="space-y-6 mt-4">
  <Card>
    <CardHeader>
      <CardTitle>Whop Integration</CardTitle>
      <CardDescription>
        Track sales from your Whop product listing
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label>Whop Product URL</Label>
        <Input placeholder="https://whop.com/ai-creator-studio" disabled />
        <p className="text-xs text-muted-foreground mt-1">
          This will be used to track affiliate sales and conversions
        </p>
      </div>
      <Button variant="outline" asChild>
        <a href="https://whop.com/sell" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Create Whop Product
        </a>
      </Button>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Sales Tracking</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Sales (All Time)</span>
          <span className="font-medium">$0.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">This Month</span>
          <span className="font-medium">$0.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Conversion Rate</span>
          <span className="font-medium">0%</span>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

---

## 🎨 PHASE 6: LANDING PAGE & MARKETING ASSETS

### 6.1 Create Landing Page Route

**File:** `src/app/landing/page.tsx`

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Users,
  Film,
  DollarSign,
  Megaphone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-purple-blue opacity-10" />
        <div className="container mx-auto px-6 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>The Complete AI Creator Platform</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              AI Creator Studio
            </h1>

            <p className="text-2xl text-muted-foreground">
              Download. Create. Profit.
            </p>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Build AI-powered content creators, automate your sales funnels, and scale your 
              creator business — all from one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a href="https://whop.com/ai-creator-studio" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="px-8 text-lg h-14">
                  Get Lifetime Access - $197
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <Link href="#features">
                <Button size="lg" variant="outline" className="px-8 text-lg h-14">
                  See Features
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              ✅ One-time payment · ✅ Lifetime updates · ✅ No monthly fees
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              From AI persona creation to automated sales — all in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg gradient-purple-blue flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Persona Builder</h3>
                <p className="text-muted-foreground">
                  Create voice-cloned, video-enabled digital personas. Upload photos, 
                  design voices, and bring AI creators to life.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg gradient-purple-blue flex items-center justify-center mb-4">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Automated Content Pipeline</h3>
                <p className="text-muted-foreground">
                  Generate scripts with AI, add voiceovers, create videos, and publish — 
                  all without leaving the platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg gradient-purple-blue flex items-center justify-center mb-4">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Direct Instagram Posting</h3>
                <p className="text-muted-foreground">
                  Post reels, stories, and carousels directly to Instagram via Meta Graph API. 
                  No third-party tools needed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg gradient-green flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Built-In Stripe Checkout</h3>
                <p className="text-muted-foreground">
                  Sell digital products with one-click Stripe integration. 
                  Track orders, revenue, and conversions from your dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg gradient-green flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">ManyChat Sales Funnels</h3>
                <p className="text-muted-foreground">
                  Automate comment-to-DM flows. Users comment "AI" → get your checkout link 
                  instantly. No manual work.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg gradient-green flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Campaign Management</h3>
                <p className="text-muted-foreground">
                  Plan content campaigns, track performance, and optimize for maximum 
                  engagement and revenue.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built For Creators</h2>
            <p className="text-lg text-muted-foreground">
              Whether you're a solopreneur or agency, AI Creator Studio scales with you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">📱 Instagram Creators</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Generate 10+ reels per day with AI voiceovers</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Auto-post at optimal times</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Sell digital products via comment-to-DM</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold">💼 Digital Product Sellers</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Create AI personas to promote your products</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Automated content marketing</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Track revenue & conversions</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold">🎬 Content Agencies</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Manage multiple client personas</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Scale content production 10x</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>White-label for clients</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold">🚀 Course Creators</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>AI-generate course promo content</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Build lead magnets with AI</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Integrated checkout for course sales</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, One-Time Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Pay once. Own forever. No monthly fees.
            </p>
          </div>

          <Card className="max-w-lg mx-auto border-primary/50 shadow-lg">
            <CardContent className="pt-8 text-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Lifetime Access</h3>
                  <p className="text-muted-foreground">Everything you need to scale</p>
                </div>

                <div>
                  <span className="text-6xl font-bold">$197</span>
                  <p className="text-sm text-muted-foreground mt-2">One-time payment</p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited AI Personas</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited Content Generation</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Direct Instagram API Integration</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">ManyChat Sales Funnel Templates</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Stripe Checkout Integration</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Lifetime Updates</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Priority Support (90 days)</span>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Full Source Code Access</span>
                  </div>
                </div>

                <a href="https://whop.com/ai-creator-studio" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full text-lg h-14">
                    Get Lifetime Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>

                <p className="text-xs text-muted-foreground">
                  Secure checkout via Whop (powered by Stripe)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Do I need to code?</h3>
                <p className="text-muted-foreground">
                  No! AI Creator Studio is a complete web app. Just deploy to Vercel 
                  (one-click), add your API keys, and start creating. If you can follow 
                  a setup wizard, you can use this.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">What API keys do I need?</h3>
                <p className="text-muted-foreground">
                  Required: ElevenLabs (voice), Kling or HeyGen (video), Anthropic (scripts), 
                  Stripe (payments). All have free tiers to start! Check the "Getting API Keys" 
                  section in the docs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">How much do the APIs cost?</h3>
                <p className="text-muted-foreground">
                  ElevenLabs: 10k chars/month free (~30 videos). Kling: 66 free credits 
                  (~6 videos). After that, it's pay-as-you-go. Typical cost: $20-50/month 
                  for 100+ videos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Can I sell this to clients?</h3>
                <p className="text-muted-foreground">
                  Yes! You get full source code access. Deploy it for your clients, 
                  white-label it, or resell it as a service. Commercial use is allowed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Do you offer refunds?</h3>
                <p className="text-muted-foreground">
                  Yes — 14-day money-back guarantee, no questions asked. If it's not for you, 
                  just email support and we'll refund you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">What if I need help?</h3>
                <p className="text-muted-foreground">
                  90 days of priority email support included. Plus lifetime access to updates 
                  and documentation. We also have a Discord community (optional).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <Card className="max-w-3xl mx-auto gradient-purple-blue text-white border-0 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Scale Your Creator Business?
              </h2>
              <p className="text-xl mb-8 text-white/80">
                Join hundreds of creators using AI to 10x their content output and revenue.
              </p>
              <a href="https://whop.com/ai-creator-studio" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" className="px-8 text-lg h-14">
                  Get Lifetime Access - $197
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <p className="text-sm text-white/70 mt-4">
                ✅ 14-day money-back guarantee · ✅ Instant access via Whop
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>© 2024 AI Creator Studio. All rights reserved.</p>
          <p className="mt-2">
            <a href="mailto:support@aicreatostudio.com" className="underline">
              support@aicreatostudio.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
```

Update the metadata for this page:

**File:** `src/app/landing/layout.tsx` (optional, for different meta)

```typescript
export const metadata = {
  title: "AI Creator Studio - Download. Create. Profit.",
  description: "Build AI-powered content creators and automate your sales funnels. One-time $197. Lifetime access.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### 6.2 Make Landing Page Standalone (No Sidebar)

Update `src/app/landing/page.tsx` to bypass the main layout:

Actually, create a separate layout for landing:

**File:** `src/app/landing/layout.tsx`

```typescript
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
```

This will override the root layout's sidebar for just this route.

---

## ✅ FINAL CHECKLIST

### Pre-Launch

- [ ] All phases implemented
- [ ] Onboarding wizard tested (create dummy settings entry to reset)
- [ ] Dashboard loads with proper branding
- [ ] All API integrations working
- [ ] Stripe checkout flow tested
- [ ] Instagram OAuth tested
- [ ] Landing page deployed and live
- [ ] Whop product created
- [ ] ManyChat automation tested

### Post-Launch

- [ ] Monitor error logs in Vercel
- [ ] Set up Sentry or similar for error tracking
- [ ] Create explainer video (Loom) for setup process
- [ ] Write blog post: "How I Built an AI Creator Platform"
- [ ] Share on Twitter, Reddit, Indie Hackers
- [ ] Reach out to micro-influencers for affiliates

---

## 🎯 IMPLEMENTATION PRIORITY

**For Claude Code: Execute in this order**

1. **Phase 1** (30 min) — Get it running
2. **Phase 2** (2-3 hours) — Onboarding wizard (critical for UX)
3. **Phase 3** (1-2 hours) — Branding & polish
4. **Phase 6** (1 hour) — Landing page (for sales)
5. **Phase 4** (30 min) — Deploy config
6. **Phase 5** (30 min) — Whop docs

**Total estimated time: 6-8 hours of focused work**

---

## 📝 NOTES FOR CLAUDE CODE

### Common Pitfalls

1. **Prisma client not found**: Run `npx prisma generate` before building
2. **Environment variables**: Make sure `NEXT_PUBLIC_` prefix is used for client-side vars
3. **Framer Motion**: Import from `"framer-motion"`, not `"framer-motion/dist/framer-motion"`
4. **Tailwind purge**: Make sure all component paths are in `tailwind.config.ts`
5. **Server vs Client**: Mark components with `"use client"` if using hooks or state

### Testing Checklist

After each phase:
- [ ] Run `npm run build` to verify no build errors
- [ ] Test in browser (both desktop and mobile viewport)
- [ ] Check console for warnings
- [ ] Verify database queries work (check Prisma Studio)

### Code Style

- Use TypeScript strictly (no `any` unless absolutely necessary)
- Follow existing file structure (don't create new patterns)
- Keep components under 300 lines (extract subcomponents if needed)
- Add comments for complex logic
- Use `async/await` for all async operations (not `.then()`)

---

## 🚀 READY TO BUILD!

This spec is complete and actionable. Claude Code should be able to:
1. Read this file
2. Execute each phase sequentially
3. Deploy a fully functional AI Creator Studio

**Good luck! 🎉**
