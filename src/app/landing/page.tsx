"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Upload,
  DollarSign,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Instagram,
  Youtube,
  Megaphone,
  Shield,
  Rocket,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const heygenLink = process.env.NEXT_PUBLIC_HEYGEN_AFFILIATE_LINK || "https://app.heygen.com";

  const features = [
    {
      icon: Upload,
      title: "Upload & Publish",
      description: "Create videos in HeyGen, download the MP4, upload here. We handle the rest — Instagram, TikTok, YouTube.",
    },
    {
      icon: Megaphone,
      title: "Multi-Platform Publishing",
      description: "Post to Instagram, TikTok, and YouTube automatically. One dashboard, every platform.",
    },
    {
      icon: DollarSign,
      title: "Built-in Monetization",
      description: "Stripe integration for payments, ManyChat for comment-to-DM automation. Start selling instantly.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Tracking",
      description: "Track performance, orders, and revenue in real-time. Data-driven content decisions.",
    },
    {
      icon: Sparkles,
      title: "Powered by HeyGen",
      description: "Create stunning AI avatar videos with HeyGen. Realistic avatars, natural voices, professional quality.",
    },
    {
      icon: Shield,
      title: "Production Ready",
      description: "Built with Next.js 16, TypeScript, Prisma 7, and Tailwind. Deploy to Vercel in 1 click.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Deploy in 1 Click",
      description: "Click the Vercel button, set your environment variables, and you're live in 2 minutes.",
    },
    {
      number: "2",
      title: "Connect Your Accounts",
      description: "Link your Instagram, set up Stripe for payments, and configure ManyChat for DM automation.",
    },
    {
      number: "3",
      title: "Upload & Profit",
      description: "Create videos in HeyGen, upload them here, publish everywhere, and start making money.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Create AI Videos in HeyGen. Automate Everything Else.</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Creator Studio
              </span>
            </h1>

            <p className="text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto font-medium">
              Upload videos. Auto-post everywhere. Make money.
              <br />
              <span className="text-foreground font-bold">All in one platform.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a
                href="https://whop.com/your-product-id/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="gradient-purple-blue text-white text-lg px-8 py-6 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all">
                  <Rocket className="mr-2 h-5 w-5" />
                  Get Access Now - $97
                </Button>
              </a>
              <Link href="/">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Live Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 justify-center items-center text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>One-time payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Instant repo access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Deploy to your Vercel</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative gradient blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Everything You Need to Win</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your HeyGen videos, publish everywhere, and monetize with built-in payments and automation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-purple-200">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg gradient-purple-blue flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HeyGen Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 text-lg px-6 py-2">
              Powered by HeyGen
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Create AI Videos in HeyGen
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Use HeyGen&apos;s studio to create stunning AI avatar videos, then upload them here to publish and monetize.
            </p>
          </div>

          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Realistic AI Avatars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Natural Voice Synthesis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Custom Avatar Creation</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Fast Video Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Multiple Languages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Pay-as-you-go Credits</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                <p className="text-sm text-center mb-4 font-medium">
                  <Star className="h-4 w-4 inline mr-1 text-purple-600" />
                  New to HeyGen? Create your account and start making videos
                </p>
                <div className="flex justify-center">
                  <a
                    href={heygenLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="gradient-purple-blue text-white">
                      Create Your HeyGen Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Get Started in 3 Steps</h2>
            <p className="text-xl text-muted-foreground">
              From zero to making money in under 10 minutes.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex gap-6 items-start">
                      <div className="h-12 w-12 rounded-full gradient-purple-blue flex items-center justify-center shrink-0">
                        <span className="text-2xl font-bold text-white">{step.number}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-lg">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Instagram className="h-6 w-6 text-purple-600" />
                <Youtube className="h-6 w-6 text-red-600" />
                <Megaphone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-4xl font-bold">3+</div>
              <div className="text-muted-foreground">Social Platforms</div>
            </div>
            <div className="space-y-2">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto" />
              <div className="text-4xl font-bold">100%</div>
              <div className="text-muted-foreground">Automated Posting</div>
            </div>
            <div className="space-y-2">
              <Zap className="h-6 w-6 text-yellow-600 mx-auto" />
              <div className="text-4xl font-bold">2 min</div>
              <div className="text-muted-foreground">Deploy Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Build Your Content Empire?
          </h2>
          <p className="text-xl opacity-90">
            Join creators making money with AI-generated content. Get instant access and deploy in 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://whop.com/your-product-id/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-gray-100">
                <Rocket className="mr-2 h-5 w-5" />
                Get Access Now - $97
              </Button>
            </a>
            <Link href="/">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
                View Live Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-purple-blue flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold">AI Creator Studio</div>
                <div className="text-sm text-gray-400">Create. Profit. Repeat.</div>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                Demo
              </Link>
              <a href="https://whop.com/your-product-id/" className="hover:text-white transition-colors">
                Purchase
              </a>
              <a href="mailto:support@yourdomain.com" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
