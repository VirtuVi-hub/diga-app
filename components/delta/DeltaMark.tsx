import { Triangle } from "lucide-react";

export function DeltaMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <Triangle
      size={size}
      strokeWidth={0}
      className={`fill-accent-primary text-accent-primary ${className}`}
    />
  );
}
