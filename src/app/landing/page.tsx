"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Copy,
  Rocket,
  Key,
  Database,
  Instagram,
  MessageSquare,
  DollarSign,
  Megaphone,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbackseatdriver6767-gif%2Fai-creator-studio&env=DATABASE_URL,POSTGRES_PRISMA_URL&envDescription=Set%20up%20your%20database%20and%20API%20keys&envLink=https%3A%2F%2Fgithub.com%2Fbackseatdriver6767-gif%2Fai-creator-studio%23environment-variables&project-name=ai-creator-studio&repository-name=ai-creator-studio";

export default function LandingPage() {
  const heygenLink =
    process.env.NEXT_PUBLIC_HEYGEN_AFFILIATE_LINK || "https://app.heygen.com";

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const steps = [
    {
      number: "1",
      icon: Rocket,
      title: "Deploy to Vercel",
      description:
        "Click the button below. Vercel will clone the app and deploy it to your own URL. Takes ~2 minutes.",
      action: (
        <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
          <Button className="bg-black text-white hover:bg-gray-800 mt-3">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 76 65" fill="currentColor">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            Deploy to Vercel
          </Button>
        </a>
      ),
    },
    {
      number: "2",
      icon: Database,
      title: "Set Up Your Database",
      description:
        "You need a PostgreSQL database. We recommend Neon (free tier) or Supabase.",
      action: (
        <div className="flex gap-2 mt-3">
          <a
            href="https://neon.tech"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              Neon (Free)
            </Button>
          </a>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              Supabase
            </Button>
          </a>
        </div>
      ),
    },
    {
      number: "3",
      icon: Instagram,
      title: "Connect Instagram",
      description:
        "Go to Settings > Social Accounts in your app and connect your Instagram Business account. You need a Meta Developer App for this.",
      action: (
        <a
          href="https://developers.facebook.com/apps/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="mt-3">
            <ExternalLink className="h-3 w-3 mr-1" />
            Meta Developer Portal
          </Button>
        </a>
      ),
    },
    {
      number: "4",
      icon: DollarSign,
      title: "Set Up Stripe",
      description:
        "Create a Stripe account and add your API keys to your Vercel environment variables. This lets you create products and accept payments.",
      action: (
        <a
          href="https://dashboard.stripe.com/apikeys"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="mt-3">
            <ExternalLink className="h-3 w-3 mr-1" />
            Stripe Dashboard
          </Button>
        </a>
      ),
    },
    {
      number: "5",
      icon: MessageSquare,
      title: "Set Up ManyChat",
      description:
        "Get ManyChat Pro ($15/mo), connect your Instagram, and add your API key. When you publish a campaign, the app auto-creates the keyword automation.",
      action: (
        <a
          href="https://manychat.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="mt-3">
            <ExternalLink className="h-3 w-3 mr-1" />
            ManyChat
          </Button>
        </a>
      ),
    },
    {
      number: "6",
      icon: Sparkles,
      title: "Create Videos in HeyGen",
      description:
        "Sign up for HeyGen, create your AI avatar, make your first video, download the MP4, and upload it in your Campaign Builder.",
      action: (
        <a href={heygenLink} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="mt-3">
            <ExternalLink className="h-3 w-3 mr-1" />
            Open HeyGen
          </Button>
        </a>
      ),
    },
  ];

  const envVars = [
    { key: "DATABASE_URL", desc: "PostgreSQL connection string", required: true },
    { key: "POSTGRES_PRISMA_URL", desc: "Same as DATABASE_URL", required: true },
    { key: "META_APP_ID", desc: "Meta/Facebook App ID", required: false },
    { key: "META_APP_SECRET", desc: "Meta/Facebook App Secret", required: false },
    { key: "STRIPE_SECRET_KEY", desc: "Stripe Secret Key (sk_live_...)", required: false },
    { key: "STRIPE_WEBHOOK_SECRET", desc: "Stripe Webhook Secret (whsec_...)", required: false },
    { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", desc: "Stripe Publishable Key (pk_live_...)", required: false },
    { key: "MANYCHAT_API_TOKEN", desc: "ManyChat API Key", required: false },
    { key: "NEXT_PUBLIC_APP_URL", desc: "Your deployed app URL", required: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Purchase Complete — Let&apos;s Get You Set Up</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Creator Studio
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow these steps to deploy your own AI Creator Studio and start making money with AI content.
            </p>

            <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-black text-white hover:bg-gray-800 text-lg px-8 py-6 shadow-lg mt-4"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 76 65" fill="currentColor">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                Deploy to Vercel — Free
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center mb-8">
            Setup Guide
          </h2>

          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 hover:border-purple-200 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex gap-5 items-start">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-purple-600" />
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                      {step.action}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Environment Variables Reference */}
      <section className="py-12 px-6 bg-white/50">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Environment Variables Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add these in Vercel: Project Settings → Environment Variables. Only DATABASE_URL is required to start.
              </p>
              <div className="space-y-2">
                {envVars.map((v) => (
                  <div
                    key={v.key}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs shrink-0">
                        {v.key}
                      </code>
                      <span className="text-muted-foreground text-xs truncate">
                        {v.desc}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {v.required && (
                        <span className="text-xs text-red-600 font-medium">
                          Required
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyText(v.key)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Megaphone className="h-12 w-12 text-purple-600 mx-auto" />
          <h2 className="text-3xl font-bold">You&apos;re Ready</h2>
          <p className="text-muted-foreground">
            Once deployed, open your app and the onboarding wizard will walk you through connecting everything. Create your first campaign, upload a HeyGen video, and hit Publish.
          </p>
          <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg px-8 py-6"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Deploy Now
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">AI Creator Studio</span>
          </div>
          <p className="text-sm text-gray-400">Create. Profit. Repeat.</p>
        </div>
      </footer>
    </div>
  );
}
