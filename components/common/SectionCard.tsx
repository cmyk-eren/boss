import { cn } from "@/lib/utils";

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        "card-shadow rounded-[28px] border border-slate-200/80 bg-white p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
