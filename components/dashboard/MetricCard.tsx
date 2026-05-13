import { TrendingUp } from "lucide-react";

import { SectionCard } from "@/components/common/SectionCard";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <SectionCard className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#2f6bff]/8 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <div className="rounded-2xl bg-[#eaf1ff] p-3 text-[#2f6bff]">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
    </SectionCard>
  );
}
