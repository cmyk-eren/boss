"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BadgePercent,
  Bot,
  Boxes,
  CreditCard,
  Gauge,
  Gift,
  PackageCheck,
  Settings,
  ShoppingBag,
  Store,
  UserRound,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/stores", label: "Mağazalar", icon: Store },
  { href: "/products", label: "Ürünler", icon: Boxes },
  { href: "/orders", label: "Siparişler", icon: PackageCheck },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/price-calculator", label: "Fiyat Hesaplayıcı", icon: WalletCards },
  { href: "/commission-rates", label: "Komisyon Oranları", icon: BadgePercent },
  { href: "/mavibot", label: "Mavibot", icon: Bot },
  { href: "/profile", label: "Profil", icon: UserRound },
  { href: "/subscription", label: "Abonelik", icon: CreditCard },
  { href: "/invite", label: "Davet Et", icon: Gift },
  { href: "/settings", label: "Ayarlar", icon: Settings },
  { href: "/integrations/trendyol", label: "Trendyol Entegrasyonu", icon: ShoppingBag },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-white/60 bg-[#f7fafe]/90 px-6 py-6 backdrop-blur xl:flex">
      <div className="flex items-center gap-3 rounded-[26px] bg-white px-4 py-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2f6bff] text-lg font-bold text-white">
          M
        </div>
        <div>
          <p className="font-heading text-lg font-bold text-slate-900">Mavikon</p>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Trendyol Paneli
          </p>
        </div>
      </div>
      <nav className="mt-8 flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-[#2f6bff] text-white shadow-lg shadow-blue-200"
                  : "text-slate-600 hover:bg-white hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-[26px] border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Güvenlik
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Trendyol kimlik bilgileri yalnızca backend üzerinde şifreli şekilde tutulur.
        </p>
      </div>
    </aside>
  );
}
