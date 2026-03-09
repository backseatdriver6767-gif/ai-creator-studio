import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, ExternalLink, CheckCircle } from "lucide-react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SocialStep({ onNext }: StepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold">Connect Social Media</h2>
        <p className="text-muted-foreground text-lg">
          Link Instagram to start publishing AI-generated content
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center">
                <Instagram className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Instagram Business</CardTitle>
                <CardDescription>Direct posting via Meta Graph API</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/api/auth/instagram">
              <Button className="w-full h-12" size="lg">
                <Instagram className="h-5 w-5 mr-2" />
                Connect Instagram Account
              </Button>
            </a>

            <div className="space-y-2 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
              <p className="font-medium text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Prerequisites:
              </p>
              <ul className="list-disc list-inside space-y-1.5 ml-6">
                <li>Instagram <strong>Business</strong> or <strong>Creator</strong> account</li>
                <li>Instagram linked to a Facebook Page</li>
                <li>Meta App credentials (we'll guide you)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>TikTok & YouTube</span>
              <span className="text-xs font-normal text-muted-foreground">Optional</span>
            </CardTitle>
            <CardDescription className="text-sm">Coming soon via Late.dev integration</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="https://getlate.dev" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-2" />
                Learn More
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
