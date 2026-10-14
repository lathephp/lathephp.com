import { cn } from "~/lib/utils";

export function LatheLogo({
  size = "default",
}: {
  size?: "default" | "large";
}) {
  const isLarge = size === "large";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-foreground text-background font-bold uppercase tracking-[0.15em]",
        isLarge ? "px-4 h-9 text-base" : "px-2.5 h-7 text-xs"
      )}
    >
      Lathe
    </span>
  );
}
