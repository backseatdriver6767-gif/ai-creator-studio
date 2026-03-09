import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface StepProps {
  onFinish: () => void;
}

export function ReadyStep({ onFinish }: StepProps) {
  return (
    <div className="text-center space-y-10 py-8">
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-2xl"
      >
        <CheckCircle className="h-12 w-12 text-white" />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h1 className="text-5xl md:text-6xl font-bold">You're All Set!</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          AI Creator Studio is ready to help you build, scale, and monetize your AI content empire.
        </p>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-4 max-w-md mx-auto"
      >
        <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-purple-500/20 bg-purple-500/5 text-left hover:border-purple-500/40 transition-colors">
          <Sparkles className="h-8 w-8 text-purple-500 shrink-0" />
          <div>
            <strong className="text-foreground block mb-1">First Step</strong>
            <span className="text-sm text-muted-foreground">Create your first AI persona</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 text-left hover:border-blue-500/40 transition-colors">
          <Rocket className="h-8 w-8 text-blue-500 shrink-0" />
          <div>
            <strong className="text-foreground block mb-1">Pro Tip</strong>
            <span className="text-sm text-muted-foreground">Start with a simple niche (fitness tips, cooking hacks)</span>
          </div>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col gap-3 pt-8"
      >
        <Link href="/personas/new" onClick={onFinish}>
          <Button
            size="lg"
            className="w-full max-w-sm h-14 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            Create Your First Persona
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={onFinish}
          className="text-muted-foreground hover:text-foreground"
        >
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
