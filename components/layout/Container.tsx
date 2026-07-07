import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const sizes = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
} as const;

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: keyof typeof sizes;
};

export function Container({
  className,
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}
      {...props}
    />
  );
}
