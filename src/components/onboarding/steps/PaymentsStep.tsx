import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, ExternalLink } from "lucide-react";
import { useState } from "react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PaymentsStep({ onNext }: StepProps) {
  const [stripeKey, setStripeKey] = useState('');

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold">Set Up Payments</h2>
        <p className="text-muted-foreground text-lg">
          Connect Stripe to accept payments for digital products
        </p>
      </div>

      <Card className="max-w-xl mx-auto border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>Stripe</CardTitle>
              <CardDescription>Accept payments globally</CardDescription>
            </div>
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-2" />
                Get Keys
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stripe" className="text-sm font-medium">
              Stripe Secret Key (optional for now)
            </Label>
            <Input
              id="stripe"
              type="password"
              placeholder="sk_test_..."
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
              className="mt-2 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Find this in your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Stripe Dashboard</a>
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-green-900 dark:text-green-100">Why Stripe?</p>
              <p className="text-green-700 dark:text-green-300 leading-relaxed">
                Stripe handles all payment processing, subscriptions, and customer management.
                Integrates seamlessly with ManyChat for automated sales funnels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-center text-muted-foreground max-w-lg mx-auto">
        You can configure this later in Settings if you're not ready yet
      </p>
    </div>
  );
}
