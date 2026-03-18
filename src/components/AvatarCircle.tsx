import { cn } from "@/lib/utils";

interface AvatarCircleProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function AvatarCircle({ initials, size = 'md', className }: AvatarCircleProps) {
  return (
    <div className={cn(
      "rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center shrink-0",
      sizes[size],
      className
    )}>
      {initials}
    </div>
  );
}
