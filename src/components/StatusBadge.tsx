import { cn } from "@/lib/utils";
import { statusColors } from "@/lib/demo-data";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusLabels: Record<string, string> = {
  active: 'Aktivní',
  inactive: 'Neaktivní',
  lead: 'Potenciální',
  at_risk: 'V ohrožení',
  draft: 'Koncept',
  completed: 'Dokončeno',
  booked: 'Rezervováno',
  cancelled: 'Zrušeno',
  no_show: 'Nedostavil se',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
      statusColors[status],
      className
    )}>
      {statusLabels[status] || status}
    </span>
  );
}
