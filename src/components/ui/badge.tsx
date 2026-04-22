import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      default:     "border-transparent bg-primary/20 text-primary border border-primary/30",
      secondary:   "border-transparent bg-secondary text-secondary-foreground",
      destructive: "border-transparent bg-destructive/20 text-destructive border border-destructive/30",
      outline:     "border-border text-muted-foreground",
      success:     "border-transparent bg-success/20 text-success border border-success/30",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide font-display transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
