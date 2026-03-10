"use client";

import { use, useState, useEffect } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useContentPiece,
  useUpdateContent,
  usePublishContent,
  useScheduleContent,
  useUploadVideo,
  useCampaigns,
  useProducts,
} from "@/lib/hooks";
import { VideoUploader } from "@/components/content/video-uploader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import {
  Send,
  Loader2,
  Calendar,
  CheckCircle,
  Circle,
  User,
  Film,
  MessageSquare,
  Tag,
  ShoppingBag,
  Megaphone,
} from "lucide-react";

type ProductType = {
  id: string;
  name: string;
  price: number;
  checkoutUrl: string | null;
};

type CampaignType = {
  id: string;
  name: string;
  manychatKeyword: string | null;
  products: ProductType[];
};

type PieceType = {
  id: string;
  title: string;
  caption: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  type: string;
  format: string;
  platform: string[];
  duration: number | null;
  aspectRatio: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  personaId: string;
  campaignId: string | null;
  persona: { id: string; name: string };
  campaign: CampaignType | null;
};

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useContentPiece(id);
  const updateContent = useUpdateContent(id);
  const publishContent = usePublishContent(id);
  const scheduleContent = useScheduleContent(id);
  const uploadVideo = useUploadVideo(id);

  const piece = data as PieceType | undefined;

  // Fetch campaigns for this persona (for campaign selector)
  const { data: campaignsData } = useCampaigns(
    piece?.personaId ? { personaId: piece.personaId } : undefined
  );
  const campaigns = campaignsData as CampaignType[] | undefined;

  // Fetch all products (for context)
  const { data: productsData } = useProducts();
  const allProducts = productsData as ProductType[] | undefined;

  const [caption, setCaption] = useState("");
  const [captionDirty, setCaptionDirty] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  // Sync caption from server data
  useEffect(() => {
    if (piece && !captionDirty) {
      setCaption(piece.caption || "");
    }
  }, [piece, captionDirty]);

  const handleUpload = async (file: File) => {
    try {
      await uploadVideo.mutateAsync(file);
      toast.success("Video uploaded!");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSaveCaption = async () => {
    try {
      await updateContent.mutateAsync({ caption });
      setCaptionDirty(false);
      toast.success("Caption saved");
    } catch {
      toast.error("Failed to save caption");
    }
  };

  const handleCampaignChange = async (campaignId: string) => {
    try {
      await updateContent.mutateAsync({
        campaignId: campaignId === "none" ? null : campaignId,
      });
      toast.success(campaignId === "none" ? "Campaign removed" : "Campaign linked");
    } catch {
      toast.error("Failed to update campaign");
    }
  };

  const handlePublish = async () => {
    // Auto-save caption if dirty
    if (captionDirty) {
      await updateContent.mutateAsync({ caption });
      setCaptionDirty(false);
    }
    try {
      await publishContent.mutateAsync();
      toast.success("Published!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publishing failed");
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) {
      toast.error("Please select a date and time");
      return;
    }
    // Auto-save caption if dirty
    if (captionDirty) {
      await updateContent.mutateAsync({ caption });
      setCaptionDirty(false);
    }
    try {
      await scheduleContent.mutateAsync(scheduleDate);
      toast.success("Content scheduled!");
      setShowScheduler(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scheduling failed");
    }
  };

  if (isLoading) {
    return (
      <div>
        <TopBar title="Loading..." />
        <div className="p-6 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!piece) {
    return (
      <div>
        <TopBar title="Not Found" />
        <div className="p-6"><p className="text-muted-foreground">Content not found</p></div>
      </div>
    );
  }

  const isPending = publishContent.isPending || scheduleContent.isPending || uploadVideo.isPending || updateContent.isPending;
  const isPublished = piece.status === "PUBLISHED";
  const hasVideo = !!piece.videoUrl;
  const hasCaption = !!(caption || piece.caption);
  const linkedCampaign = piece.campaign;
  const linkedProduct = linkedCampaign?.products?.[0];

  return (
    <div>
      <TopBar title={piece.title}>
        <StatusBadge status={piece.status} />
      </TopBar>
      <div className="p-6 max-w-3xl space-y-6">

        {/* ===== PUBLISHED VIEW ===== */}
        {isPublished ? (
          <>
            {/* Video */}
            {piece.videoUrl && (
              <Card>
                <CardContent className="pt-6">
                  <video src={piece.videoUrl} controls className="w-full max-w-md rounded-lg" />
                </CardContent>
              </Card>
            )}

            {/* Caption */}
            {piece.caption && (
              <Card>
                <CardHeader><CardTitle className="text-base">Caption</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{piece.caption}</p>
                </CardContent>
              </Card>
            )}

            {/* Performance */}
            <Card>
              <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Views", value: piece.views ?? 0 },
                    { label: "Likes", value: piece.likes ?? 0 },
                    { label: "Comments", value: piece.comments ?? 0 },
                    { label: "Shares", value: piece.shares ?? 0 },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Persona</span>
                  <Link href={`/personas/${piece.persona.id}`} className="hover:underline">{piece.persona.name}</Link>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platforms</span>
                  <div className="flex gap-1">{piece.platform.map((p) => <StatusBadge key={p} status={p} />)}</div>
                </div>
                {piece.publishedAt && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published</span>
                      <span>{new Date(piece.publishedAt).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {linkedCampaign && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campaign</span>
                      <Link href={`/campaigns/${linkedCampaign.id}`} className="hover:underline">{linkedCampaign.name}</Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* ===== PRE-PUBLISH FLOW ===== */}

            {/* Video Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {hasVideo ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                  Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VideoUploader
                  onUpload={handleUpload}
                  isUploading={uploadVideo.isPending}
                  currentVideoUrl={piece.videoUrl}
                />
              </CardContent>
            </Card>

            {/* Caption Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {hasCaption ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                  Caption & Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder={"Write your Instagram caption here...\n\nAdd your CTA (e.g. \"Comment 'AI' for the link\")\n\n#AI #ContentCreator #HeyGen"}
                  value={caption}
                  onChange={(e) => { setCaption(e.target.value); setCaptionDirty(true); }}
                  rows={5}
                />
                {captionDirty && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveCaption}
                    disabled={updateContent.isPending}
                  >
                    {updateContent.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                    Save Caption
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Campaign & Product Section (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {linkedCampaign ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                  Campaign & Product
                  <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Link to Campaign</Label>
                  <Select
                    value={piece.campaignId || "none"}
                    onValueChange={handleCampaignChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No campaign</SelectItem>
                      {campaigns?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link to a campaign to enable ManyChat keyword automation and product checkout.
                  </p>
                </div>

                {linkedCampaign && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                    {linkedCampaign.manychatKeyword && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">ManyChat keyword:</span>
                        <code className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                          {linkedCampaign.manychatKeyword}
                        </code>
                      </div>
                    )}
                    {linkedProduct && (
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Product:</span>
                        <span className="font-medium">{linkedProduct.name}</span>
                        <span className="text-green-700 font-semibold">${(linkedProduct.price / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {!linkedProduct && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" />
                        <span>No product linked to this campaign yet.</span>
                        <Link href={`/products/new?campaignId=${linkedCampaign.id}`} className="text-primary hover:underline text-xs">
                          Add one
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ===== PRE-PUBLISH REVIEW ===== */}
            {hasVideo && (
              <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-base">Review & Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground w-20">Persona</span>
                      <span className="text-sm font-medium">{piece.persona.name}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground w-20">Video</span>
                      <span className="text-sm font-medium text-green-700">Uploaded</span>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground w-20">Caption</span>
                      <span className="text-sm truncate max-w-xs">
                        {caption ? caption.split("\n")[0].substring(0, 60) + (caption.length > 60 ? "..." : "") : <span className="text-amber-600">No caption set</span>}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground w-20">Campaign</span>
                      <span className="text-sm">{linkedCampaign ? linkedCampaign.name : <span className="text-muted-foreground">None (optional)</span>}</span>
                    </div>
                    {linkedProduct && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground w-20">Product</span>
                          <span className="text-sm font-medium">{linkedProduct.name} - ${(linkedProduct.price / 100).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Send className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground w-20">Platforms</span>
                      <div className="flex gap-1">{piece.platform.map((p) => <StatusBadge key={p} status={p} />)}</div>
                    </div>
                  </div>

                  {/* Publish Actions */}
                  <div className="pt-2 flex gap-3">
                    <Button
                      onClick={handlePublish}
                      disabled={isPending}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    >
                      {publishContent.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Publish Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowScheduler(!showScheduler)}
                      disabled={isPending}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>

                  {showScheduler && (
                    <div className="flex items-end gap-3 pt-2 border-t">
                      <div className="flex-1">
                        <Label>Schedule Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      <Button
                        onClick={handleSchedule}
                        disabled={scheduleContent.isPending || !scheduleDate}
                      >
                        {scheduleContent.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Confirm
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
