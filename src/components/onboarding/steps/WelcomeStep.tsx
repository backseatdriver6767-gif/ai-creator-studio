import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, DollarSign, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="text-center space-y-10 py-8">
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 shadow-2xl"
      >
        <Sparkles className="h-12 w-12 text-white" />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
          Welcome to<br />AI Creator Studio
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Your complete platform for building AI-powered content creators and automating your entire sales funnel.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12"
      >
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
          <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Wand2 className="h-6 w-6 text-purple-400" />
          </div>
          <div className="text-center">
            <strong className="text-foreground block mb-1">Create AI Personas</strong>
            <span className="text-sm text-muted-foreground">Voice-cloned, video-enabled digital creators</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
          <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-400" />
          </div>
          <div className="text-center">
            <strong className="text-foreground block mb-1">Automate Content</strong>
            <span className="text-sm text-muted-foreground">Scripts, voices, videos - all automated</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors">
          <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="text-center">
            <strong className="text-foreground block mb-1">Sell Products</strong>
            <span className="text-sm text-muted-foreground">Integrated Stripe & ManyChat automation</span>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="pt-8"
      >
        <Button
          onClick={onNext}
          size="lg"
          className="px-10 h-14 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25"
        >
          Let's Get Started
          <Sparkles className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Takes 3 minutes • Skip anytime
        </p>
      </motion.div>
    </div>
  );
}
