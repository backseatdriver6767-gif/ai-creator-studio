import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, CheckCircle2 } from "lucide-react";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const tiers = [
  {
    id: 'premium',
    badge: 'Premium',
    badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
    title: 'Arcads AI',
    description: 'All-in-one AI avatar solution',
    quality: 'Highest Quality',
    qualityColor: 'text-yellow-600 bg-yellow-50',
    useCase: 'Professional ads, high-converting content, premium brands',
    features: [
      'Photorealistic AI avatars',
      'Natural voice & lip-sync included',
      'Enterprise-grade quality',
      'Best for paid ads & sales'
    ],
    services: [
      { name: 'Arcads', url: 'https://www.arcads.ai', envVar: 'ARCADS_CLIENT_ID' }
    ],
    emoji: '👑',
  },
  {
    id: 'standard',
    badge: 'Standard',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white',
    title: 'HeyGen (with ElevenLabs)',
    description: 'Great quality with built-in voice',
    quality: 'Great Quality',
    qualityColor: 'text-purple-600 bg-purple-50',
    useCase: 'Social media content, explainer videos, personal branding',
    features: [
      'High-quality AI avatars',
      'ElevenLabs voices built-in',
      'Fast generation',
      'Best balance of quality & cost'
    ],
    services: [
      { name: 'HeyGen', url: 'https://heygen.com', envVar: 'HEYGEN_API_KEY' }
    ],
    emoji: '🎭',
  },
  {
    id: 'budget',
    badge: 'Budget',
    badgeColor: 'bg-gradient-to-r from-green-500 to-teal-500 text-white',
    title: 'Kling + ElevenLabs',
    description: 'Cost-effective video creation',
    quality: 'Good Quality',
    qualityColor: 'text-green-600 bg-green-50',
    useCase: 'Testing, high-volume content, organic social posts',
    features: [
      'Cinematic video generation',
      'Separate voice control',
      'Lower cost per video',
      'Best for experimentation'
    ],
    services: [
      { name: 'Kling AI', url: 'https://klingai.com', envVar: 'KLING_API_KEY' },
      { name: 'ElevenLabs', url: 'https://elevenlabs.io', envVar: 'ELEVENLABS_API_KEY' }
    ],
    emoji: '💚',
  },
];

export function AIServicesStep({ onNext }: StepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold">Choose Your AI Video Stack</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the tier that matches your quality needs and budget. You can always add more later!
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {tiers.map((tier) => (
          <Card key={tier.id} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{tier.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl">{tier.title}</CardTitle>
                        <Badge className={`${tier.badgeColor} border-0 text-xs font-semibold`}>
                          {tier.badge}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {tier.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${tier.qualityColor}`}>
                      {tier.quality}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Use Case */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-semibold">Best For:</span> {tier.useCase}
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 gap-2">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Services & Links */}
              <div className="pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  SERVICES TO SET UP:
                </p>
                <div className="flex flex-wrap gap-2">
                  {tier.services.map((service) => (
                    <a
                      key={service.name}
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[180px]"
                    >
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        <span>{service.name}</span>
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </a>
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {tier.services.map((service) => (
                    <p key={service.envVar} className="text-xs text-muted-foreground">
                      Add <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{service.envVar}</code> to your .env file
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-3 pt-4 max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-900 mb-2">💡 No API Keys Yet?</p>
          <p className="text-blue-800">
            You can skip this step and add your API keys later in Settings.
            Click the links above to sign up, then paste your keys in the .env file.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          <strong>Pro Tip:</strong> Start with one tier, test it out, then expand as needed.
          Most creators use HeyGen (Standard) for the best quality-to-cost ratio.
        </p>
      </div>
    </div>
  );
}
