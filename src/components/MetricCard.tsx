import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function MetricCard({ label, value, change, changeType = 'neutral' }: MetricCardProps) {
  return (
    <div className="rounded-xl p-5 bg-card shadow-card">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <h3 className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</h3>
        {change && (
          <span className={cn(
            "text-xs font-medium",
            changeType === 'positive' && "text-success",
            changeType === 'negative' && "text-destructive",
            changeType === 'neutral' && "text-muted-foreground",
          )}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
