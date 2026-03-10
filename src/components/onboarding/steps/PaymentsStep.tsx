import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, ExternalLink } from "lucide-react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PaymentsStep({}: StepProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Set Up Payments</h2>
        <p className="text-sm text-muted-foreground">
          Connect Stripe to accept payments for your digital products
        </p>
      </div>

      <div className="w-full max-w-md border-2 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Stripe</p>
            <p className="text-xs text-muted-foreground">Accept payments globally</p>
          </div>
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Get Keys
            </Button>
          </a>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium">How to connect:</p>
          <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1 ml-1">
            <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">stripe.com</a></li>
            <li>Copy your Secret Key from the Dashboard</li>
            <li>Add it as <code className="bg-muted px-1 rounded">STRIPE_SECRET_KEY</code> in your .env file</li>
          </ol>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2.5">
          <DollarSign className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-medium text-green-900">Why Stripe?</p>
            <p className="text-green-700 leading-relaxed">
              Handles payments, subscriptions, and integrates with ManyChat for automated sales funnels.
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        You can configure this later in Settings if you&apos;re not ready yet
      </p>
    </div>
  );
}
