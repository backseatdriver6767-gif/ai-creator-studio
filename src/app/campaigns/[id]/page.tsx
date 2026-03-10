"use client";

import { use, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { VideoUploader } from "@/components/content/video-uploader";
import {
  useCampaignBuilder,
  useUpdateCampaign,
  useCreateContent,
  useUploadVideo,
  useCreateProduct,
  usePublishContent,
  useScheduleContent,
  useUpdateContent,
} from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Film,
  User,
  ShoppingBag,
  Hash,
  Send,
  CheckCircle,
  Circle,
  Copy,
  Loader2,
  Plus,
  ExternalLink,
  Calendar,
} from "lucide-react";

type ContentPiece = {
  id: string;
  title: string;
  caption: string | null;
  videoUrl: string | null;
  status: string;
  type: string;
  platform: string[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  checkoutUrl: string | null;
  _count: { orders: number };
};

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  niche: string | null;
  productUrl: string | null;
  checkoutUrl: string | null;
  manychatKeyword: string | null;
  platforms: string[];
  status: string;
  persona: { id: string; name: string; description: string | null };
  contentPieces: ContentPiece[];
  products: Product[];
};

export default function CampaignBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, refetch } = useCampaignBuilder(id);
  const updateCampaign = useUpdateCampaign(id);
  const createContent = useCreateContent();
  const createProduct = useCreateProduct();

  const campaign = data as Campaign | undefined;

  // Editable fields
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [nicheValue, setNicheValue] = useState("");

  // Content section
  const [caption, setCaption] = useState("");
  const [captionDirty, setCaptionDirty] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);

  // Product section
  const [showProduct, setShowProduct] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Automation section
  const [keyword, setKeyword] = useState("");

  // Publish section
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  if (isLoading) {
    return (
      <div>
        <TopBar title="Loading..." />
        <div className="p-6 space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div>
        <TopBar title="Not Found" />
        <div className="p-6">
          <p className="text-muted-foreground">Campaign not found</p>
        </div>
      </div>
    );
  }

  const latestContent = campaign.contentPieces[0] as ContentPiece | undefined;
  const product = campaign.products[0] as Product | undefined;

  // Checklist items
  const hasVideo = latestContent?.videoUrl || latestContent?.status === "VIDEO_UPLOADED";
  const hasCaption = !!latestContent?.caption;
  const hasProduct = !!product;
  const hasPlatform = campaign.platforms.length > 0;
  const hasKeyword = !!campaign.manychatKeyword;

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    try {
      await updateCampaign.mutateAsync({ name: nameValue });
      setEditingName(false);
      refetch();
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleSaveDetails = async () => {
    try {
      await updateCampaign.mutateAsync({
        description: descValue || undefined,
        niche: nicheValue || undefined,
      });
      toast.success("Details saved");
      refetch();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleAddContent = async () => {
    try {
      const result = (await createContent.mutateAsync({
        personaId: campaign.persona.id,
        campaignId: campaign.id,
        title: `${campaign.name} - Video`,
        type: "REEL",
        format: "VIDEO",
        platform: campaign.platforms,
      })) as { id: string };
      setActiveContentId(result.id);
      toast.success("Content piece created");
      refetch();
    } catch {
      toast.error("Failed to create content");
    }
  };

  const handleVideoUpload = async (file: File) => {
    const contentId = activeContentId || latestContent?.id;
    if (!contentId) return;
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      const res = await fetch(`/api/content/${contentId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      setVideoFile(file);
      toast.success("Video uploaded!");
      refetch();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveCaption = async () => {
    const contentId = activeContentId || latestContent?.id;
    if (!contentId) return;
    try {
      const res = await fetch(`/api/content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      if (!res.ok) throw new Error();
      setCaptionDirty(false);
      toast.success("Caption saved");
      refetch();
    } catch {
      toast.error("Failed to save caption");
    }
  };

  const handleCreateProduct = async () => {
    if (!productName || !productPrice) {
      toast.error("Name and price are required");
      return;
    }
    const priceInCents = Math.round(parseFloat(productPrice) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast.error("Invalid price");
      return;
    }
    setCreatingProduct(true);
    try {
      await createProduct.mutateAsync({
        name: productName,
        price: priceInCents,
        campaignId: campaign.id,
      });
      toast.success("Product created with payment link!");
      refetch();
    } catch {
      toast.error("Failed to create product");
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleSaveKeyword = async () => {
    try {
      await updateCampaign.mutateAsync({ manychatKeyword: keyword });
      toast.success("Keyword saved");
      refetch();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handlePublish = async () => {
    const contentId = activeContentId || latestContent?.id;
    if (!contentId) {
      toast.error("No content to publish");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/content/${contentId}/publish`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Published!");
      await updateCampaign.mutateAsync({ status: "ACTIVE" });
      refetch();
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    const contentId = activeContentId || latestContent?.id;
    if (!contentId || !scheduleDate) return;
    setScheduling(true);
    try {
      const res = await fetch(`/api/content/${contentId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: scheduleDate }),
      });
      if (!res.ok) throw new Error();
      toast.success("Scheduled!");
      refetch();
    } catch {
      toast.error("Schedule failed");
    } finally {
      setScheduling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div>
      <TopBar title="Campaign Builder">
        <StatusBadge status={campaign.status} />
      </TopBar>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Section 1: Campaign Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Campaign Info
              </CardTitle>
              <StatusBadge status={campaign.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingName(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{campaign.name}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNameValue(campaign.name);
                      setEditingName(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Campaign objectives..."
                  defaultValue={campaign.description || ""}
                  onChange={(e) => setDescValue(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Niche</Label>
                <Input
                  placeholder="e.g. AI Tools, Beauty"
                  defaultValue={campaign.niche || ""}
                  onChange={(e) => setNicheValue(e.target.value)}
                />
              </div>
            </div>
            {(descValue || nicheValue) && (
              <Button size="sm" variant="outline" onClick={handleSaveDetails}>
                Save Details
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Persona */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Persona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{campaign.persona.name}</p>
                {campaign.persona.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaign.persona.description}
                  </p>
                )}
              </div>
              <Link href={`/personas/${campaign.persona.id}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Content (Video + Caption) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {hasVideo ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              <Film className="h-4 w-4" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!latestContent ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Add a video to this campaign
                </p>
                <Button onClick={handleAddContent} disabled={createContent.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  {createContent.isPending ? "Creating..." : "Add Video"}
                </Button>
              </div>
            ) : (
              <>
                <VideoUploader
                  onUpload={handleVideoUpload}
                  isUploading={uploadingVideo}
                  isCompleted={!!hasVideo}
                  currentVideoUrl={latestContent.videoUrl}
                />
                <Separator />
                <div>
                  <Label>Caption & Hashtags</Label>
                  <Textarea
                    placeholder={
                      "Write your Instagram caption here...\n\nInclude hashtags at the end:\n#AI #ContentCreator"
                    }
                    defaultValue={latestContent.caption || ""}
                    onChange={(e) => {
                      setCaption(e.target.value);
                      setCaptionDirty(true);
                    }}
                    rows={5}
                  />
                  {captionDirty && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={handleSaveCaption}
                    >
                      Save Caption
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Product (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {hasProduct ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              <ShoppingBag className="h-4 w-4" />
              Product
              <span className="text-xs text-muted-foreground font-normal">
                (Optional)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${(product.price / 100).toFixed(2)} &middot;{" "}
                      {product._count.orders} orders
                    </p>
                  </div>
                </div>
                {product.checkoutUrl && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-green-700 font-medium mb-1">
                        Payment Link
                      </p>
                      <p className="text-xs text-green-600 truncate">
                        {product.checkoutUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(product.checkoutUrl!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <a
                      href={product.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            ) : !showProduct ? (
              <Button
                variant="outline"
                onClick={() => setShowProduct(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a product to monetize this campaign
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    placeholder="e.g. AI Creator Blueprint"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="29.99"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateProduct}
                    disabled={creatingProduct}
                  >
                    {creatingProduct ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Product"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowProduct(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creates a Stripe product with a reusable Payment Link
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Platforms & Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {hasKeyword ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              <Hash className="h-4 w-4" />
              Platforms & Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Platforms</Label>
              <div className="flex gap-2 mt-1">
                {campaign.platforms.map((p) => (
                  <StatusBadge key={p} status={p} />
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <Label>ManyChat Keyword</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g. AI, GUIDE, LINK"
                  defaultValue={campaign.manychatKeyword || ""}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                {keyword && (
                  <Button size="sm" onClick={handleSaveKeyword}>
                    Save
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                When users comment{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  {campaign.manychatKeyword || keyword || "KEYWORD"}
                </code>{" "}
                on your post, ManyChat auto-DMs them with the checkout link.
              </p>
            </div>
            {hasProduct && product?.checkoutUrl && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Automation flow:</strong> User comments &quot;
                  {campaign.manychatKeyword || keyword || "KEYWORD"}&quot; → ManyChat DMs
                  checkout link → {product.checkoutUrl}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 6: Review & Publish */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" />
              Review & Publish
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Checklist */}
            <div className="space-y-2">
              <CheckItem done={true} label="Campaign created" />
              <CheckItem done={true} label={`Persona: ${campaign.persona.name}`} />
              <CheckItem done={!!hasVideo} label="Video uploaded" />
              <CheckItem done={hasCaption} label="Caption set" />
              <CheckItem
                done={hasProduct}
                label={
                  hasProduct
                    ? `Product: ${product!.name} ($${(product!.price / 100).toFixed(2)})`
                    : "Product created (optional)"
                }
                optional
              />
              <CheckItem done={hasPlatform} label={`Platforms: ${campaign.platforms.join(", ")}`} />
              <CheckItem
                done={hasKeyword}
                label={
                  hasKeyword
                    ? `ManyChat keyword: ${campaign.manychatKeyword}`
                    : "ManyChat keyword set (optional)"
                }
                optional
              />
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                onClick={handlePublish}
                disabled={publishing || !hasVideo}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish Now
                  </>
                )}
              </Button>
              <div className="flex gap-2 items-center">
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-auto"
                />
                <Button
                  variant="outline"
                  onClick={handleSchedule}
                  disabled={scheduling || !scheduleDate || !hasVideo}
                >
                  {scheduling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!hasVideo && (
              <p className="text-xs text-amber-600">
                Upload a video before publishing or scheduling.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckItem({
  done,
  label,
  optional,
}: {
  done: boolean;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <Circle
          className={`h-4 w-4 shrink-0 ${optional ? "text-muted-foreground/30" : "text-amber-500"}`}
        />
      )}
      <span
        className={
          done
            ? "text-foreground"
            : optional
              ? "text-muted-foreground"
              : "text-amber-700"
        }
      >
        {label}
      </span>
    </div>
  );
}
