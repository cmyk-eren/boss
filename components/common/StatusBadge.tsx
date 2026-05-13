import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone?: "blue" | "green" | "red" | "amber" | "slate";
};

const tones: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  blue: "bg-[#eaf1ff] text-[#2f6bff]",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ label, tone = "slate" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}
