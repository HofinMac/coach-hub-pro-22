import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  to?: string;
}

export function MetricCard({ label, value, change, changeType = 'neutral', icon: Icon, to }: MetricCardProps) {
  const content = (
    <div className={cn(
      "rounded-xl p-4 sm:p-5 bg-card shadow-card transition-colors",
      to && "hover:bg-accent/50 cursor-pointer"
    )}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{label}</p>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</h3>
        {change && (
          <span className={cn(
            "text-[10px] sm:text-xs font-medium leading-tight",
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

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}
