import { Sparkles, Wand2, DollarSign, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function WelcomeStep({}: StepProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-6">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 shadow-xl flex items-center justify-center"
      >
        <Sparkles className="h-8 w-8 text-white" />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
          Welcome to AI Creator Studio
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto">
          Create AI videos, publish to Instagram, and automate your sales funnel.
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-3 gap-4 w-full max-w-lg"
      >
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
          <Wand2 className="h-5 w-5 text-purple-400" />
          <strong className="text-sm">AI Personas</strong>
          <span className="text-xs text-muted-foreground leading-tight">Create digital creators</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <Zap className="h-5 w-5 text-blue-400" />
          <strong className="text-sm">Auto-Publish</strong>
          <span className="text-xs text-muted-foreground leading-tight">Upload and post everywhere</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <DollarSign className="h-5 w-5 text-cyan-400" />
          <strong className="text-sm">Sell Products</strong>
          <span className="text-xs text-muted-foreground leading-tight">Stripe + ManyChat</span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground"
      >
        Takes 2 minutes to set up
      </motion.p>
    </div>
  );
}
