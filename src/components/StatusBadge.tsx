import { cn } from "@/lib/utils";
import { ClientStatus, statusColors } from "@/lib/demo-data";

interface StatusBadgeProps {
  status: ClientStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
      statusColors[status],
      className
    )}>
      {status === 'at_risk' ? 'At Risk' : status}
    </span>
  );
}
