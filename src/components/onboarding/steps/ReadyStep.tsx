import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface StepProps {
  onFinish: () => void;
}

export function ReadyStep({ onFinish }: StepProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-5">
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.7 }}
        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-xl flex items-center justify-center"
      >
        <CheckCircle className="h-8 w-8 text-white" />
      </motion.div>

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-bold">You&apos;re All Set!</h1>
        <p className="text-base text-muted-foreground max-w-md mx-auto">
          AI Creator Studio is ready. Create your first persona and start publishing.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col gap-3 w-full max-w-sm"
      >
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-purple-500/20 bg-purple-500/5 text-left">
          <Sparkles className="h-6 w-6 text-purple-500 shrink-0" />
          <div>
            <strong className="text-sm block">First Step</strong>
            <span className="text-xs text-muted-foreground">Create your first AI persona</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 text-left">
          <Rocket className="h-6 w-6 text-blue-500 shrink-0" />
          <div>
            <strong className="text-sm block">Pro Tip</strong>
            <span className="text-xs text-muted-foreground">Start with one niche (fitness tips, AI tools, cooking)</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-2 w-full max-w-sm"
      >
        <Link href="/personas/new" onClick={onFinish}>
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          >
            Create Your First Persona
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={onFinish} className="text-muted-foreground">
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
