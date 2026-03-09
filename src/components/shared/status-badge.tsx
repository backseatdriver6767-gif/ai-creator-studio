import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  ARCHIVED: "bg-yellow-100 text-yellow-700",
  SCRIPT_READY: "bg-blue-100 text-blue-700",
  VOICE_GENERATING: "bg-purple-100 text-purple-700",
  VIDEO_GENERATING: "bg-purple-100 text-purple-700",
  COMPOSITING: "bg-orange-100 text-orange-700",
  READY: "bg-green-100 text-green-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  QUEUED: "bg-gray-100 text-gray-700",
  REFUNDED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-700";
  return (
    <Badge variant="secondary" className={colorClass}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
