import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Sparkles, ArrowRight, Info } from "lucide-react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AIServicesStep({ onNext }: StepProps) {
  const heygenLink = process.env.NEXT_PUBLIC_HEYGEN_AFFILIATE_LINK || "https://app.heygen.com";

  return (
    <div className="h-full flex flex-col items-center justify-center gap-5">
      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-1">
        <Sparkles className="h-3 w-3 mr-1.5 inline" />
        Powered by HeyGen
      </Badge>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Set Up Your HeyGen Account</h2>
        <p className="text-sm text-muted-foreground">
          Create AI avatar videos in HeyGen, then upload them here to publish.
        </p>
      </div>

      <div className="w-full max-w-md border-2 border-purple-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">How It Works</p>
            <p className="text-xs text-muted-foreground">No API key needed</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { n: "1", title: "Create your video in HeyGen", sub: "Choose avatar, write script, generate" },
            { n: "2", title: "Download the finished MP4", sub: "Renders in minutes" },
            { n: "3", title: "Upload & publish from here", sub: "We handle Instagram, payments, DMs" },
          ].map((s) => (
            <div key={s.n} className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{s.n}</span>
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-800">
            <strong>No API key needed.</strong> Create videos in HeyGen&apos;s app, upload the MP4 here.
          </p>
        </div>

        <div className="space-y-2">
          <a href={heygenLink} target="_blank" rel="noopener noreferrer" className="block">
            <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Your HeyGen Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={onNext} className="w-full">
            I Already Have an Account
          </Button>
        </div>
      </div>
    </div>
  );
}
