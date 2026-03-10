import { Button } from "@/components/ui/button";
import { Instagram, CheckCircle } from "lucide-react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SocialStep({}: StepProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Connect Instagram</h2>
        <p className="text-sm text-muted-foreground">
          Link your Instagram Business account to start publishing
        </p>
      </div>

      <div className="w-full max-w-md border-2 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center shrink-0">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Instagram Business</p>
            <p className="text-xs text-muted-foreground">Direct posting via Meta Graph API</p>
          </div>
        </div>

        <a href="/api/auth/instagram">
          <Button className="w-full" size="sm">
            <Instagram className="h-4 w-4 mr-2" />
            Connect Instagram Account
          </Button>
        </a>

        <div className="bg-muted/30 p-3 rounded-lg space-y-1.5">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            Prerequisites
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground ml-5">
            <li>Instagram <strong>Business</strong> or <strong>Creator</strong> account</li>
            <li>Instagram linked to a Facebook Page</li>
            <li>Meta App credentials configured in .env</li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-sm">
        TikTok & YouTube support coming soon. You can configure them later in Settings.
      </p>
    </div>
  );
}
