import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Sparkles, ArrowRight, Info } from "lucide-react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AIServicesStep({ onNext }: StepProps) {
  const heygenLink = process.env.NEXT_PUBLIC_HEYGEN_AFFILIATE_LINK || "https://app.heygen.com";

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 text-base px-6 py-2">
          <Sparkles className="h-4 w-4 mr-2 inline" />
          Powered by HeyGen
        </Badge>
        <h2 className="text-4xl font-bold">Set Up Your HeyGen Account</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Create your AI avatar videos in HeyGen, then upload them here to publish everywhere.
        </p>
      </div>

      <Card className="border-2 border-purple-200 max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Video className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">How It Works</CardTitle>
          <CardDescription className="text-base">
            No API key needed. Create videos in HeyGen and upload the MP4 here.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">1</span>
              </div>
              <div>
                <p className="font-semibold">Create your video in HeyGen</p>
                <p className="text-sm text-muted-foreground">Choose an avatar, write your script, generate the video</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">2</span>
              </div>
              <div>
                <p className="font-semibold">Download the finished MP4</p>
                <p className="text-sm text-muted-foreground">HeyGen will render your video in minutes</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">3</span>
              </div>
              <div>
                <p className="font-semibold">Upload & publish from here</p>
                <p className="text-sm text-muted-foreground">We handle Instagram, TikTok, YouTube, payments, and DM automation</p>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                <strong>No API key needed.</strong> You create videos directly in HeyGen&apos;s app and upload the MP4 file here for publishing.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <a
              href={heygenLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full gradient-purple-blue text-white text-base">
                <Sparkles className="mr-2 h-5 w-5" />
                Create Your HeyGen Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={onNext}
              className="w-full text-base"
            >
              I Already Have an Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
