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

// Step configuration
const STEPS = [
  { id: 'welcome', component: WelcomeStep, title: 'Welcome', showNav: false },
  { id: 'ai', component: AIServicesStep, title: 'AI Services', showNav: true },
  { id: 'social', component: SocialStep, title: 'Social Media', showNav: true },
  { id: 'payments', component: PaymentsStep, title: 'Payments', showNav: true },
  { id: 'ready', component: ReadyStep, title: 'Ready!', showNav: false },
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
  const showSkip = currentStep > 0 && currentStep < STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with Progress */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">AI</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold">AI Creator Studio</h2>
                <p className="text-xs text-muted-foreground">Setup Wizard</p>
              </div>
            </div>

            {showSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={isCompleting}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip Setup
                <X className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Step Indicator Dots */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-purple-500'
                  : idx < currentStep
                  ? 'w-2 bg-purple-300'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
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
      </div>

      {/* Navigation Footer (only for middle steps) */}
      {STEPS[currentStep].showNav && (
        <div className="border-t border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="max-w-3xl mx-auto flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
