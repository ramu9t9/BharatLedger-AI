import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/api/client";

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  className?: string;
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "success" | "warning"; label: string }> = {
  UPLOADED: { variant: "secondary", label: "Uploaded" },
  PROCESSING: { variant: "warning", label: "Processing" },
  EXTRACTED: { variant: "success", label: "Extracted" },
  NEEDS_REVIEW: { variant: "warning", label: "Needs Review" },
  FAILED: { variant: "destructive", label: "Failed" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: "secondary", label: status };
  
  return (
    <Badge variant={config.variant} className={cn("", className)}>
      {config.label}
    </Badge>
  );
}
