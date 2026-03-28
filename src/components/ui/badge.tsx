import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-body transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        available: "border-transparent bg-status-available/15 text-status-available",
        booked: "border-transparent bg-status-booked/15 text-status-booked",
        "on-hold": "border-transparent bg-status-on-hold/15 text-status-on-hold",
        audition: "border-transparent bg-event-audition/15 text-event-audition",
        callback: "border-transparent bg-event-callback/15 text-event-callback",
        booking: "border-transparent bg-event-booking/15 text-event-booking",
        meeting: "border-transparent bg-event-meeting/15 text-event-meeting",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
