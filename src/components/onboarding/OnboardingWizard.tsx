"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AIServicesStep } from "./steps/AIServicesStep";
import { SocialStep } from "./steps/SocialStep";
import { PaymentsStep } from "./steps/PaymentsStep";
import { ReadyStep } from "./steps/ReadyStep";

const STEPS = [
  { id: 'welcome', component: WelcomeStep, title: 'Welcome' },
  { id: 'ai', component: AIServicesStep, title: 'AI Services' },
  { id: 'social', component: SocialStep, title: 'Social Media' },
  { id: 'payments', component: PaymentsStep, title: 'Payments' },
  { id: 'ready', component: ReadyStep, title: 'Ready!' },
] as const;

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding, isCompleting } = useOnboarding();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
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
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">AI</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold leading-none">AI Creator Studio</h2>
                <p className="text-xs text-muted-foreground">Setup Wizard</p>
              </div>
            </div>

            {!isFirst && !isLast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={isCompleting}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Skip Setup
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Step Dots */}
      <div className="flex items-center justify-center gap-2 py-3 shrink-0">
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentStep
                ? 'w-6 bg-purple-500'
                : idx < currentStep
                ? 'w-1.5 bg-purple-300'
                : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Content - flex-1 with overflow hidden to prevent scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-3xl mx-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
              <StepComponent
                onNext={handleNext}
                onBack={handleBack}
                onFinish={handleFinish}
                isFirst={isFirst}
                isLast={isLast}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Nav - always visible */}
      <div className="border-t border-border bg-card shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-3 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {isLast ? (
            <Button
              size="sm"
              onClick={handleFinish}
              disabled={isCompleting}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
            >
              Go to Dashboard
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleNext}>
              {isFirst ? "Get Started" : "Continue"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
