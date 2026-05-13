"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionCard } from "@/components/common/SectionCard";
import { formatCurrency } from "@/lib/utils";

type SalesTrendChartProps = {
  data: Array<{
    label: string;
    revenue: number;
    estimatedProfit: number;
  }>;
};

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  return (
    <SectionCard className="h-[420px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl font-bold text-slate-900">Satış Trendi</h3>
          <p className="mt-1 text-sm text-slate-500">
            Saatlik ve günlük bazda ciro ile tahmini kâr hareketi
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2f6bff" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#2f6bff" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f9d73" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#0f9d73" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e9eef5" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${Math.round(value / 1000)}K`}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value ?? 0))}
            contentStyle={{
              borderRadius: 18,
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 40px -25px rgba(15,23,42,0.35)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2f6bff"
            fill="url(#revenueGradient)"
            strokeWidth={3}
          />
          <Area
            type="monotone"
            dataKey="estimatedProfit"
            stroke="#0f9d73"
            fill="url(#profitGradient)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}
