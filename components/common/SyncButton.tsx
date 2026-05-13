"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

type SyncButtonProps = {
  storeId?: string;
};

export function SyncButton({ storeId }: SyncButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | null>(null);

  if (!storeId) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          try {
            setPending(true);
            setMessageType("info");
            setMessage("Siparis ve urunler senkronize ediliyor...");

            const response = await fetch("/api/integrations/trendyol/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ storeId }),
            });

            const payload = await response.json();

            if (!response.ok) {
              throw new Error(payload.error ?? "Senkronizasyon başlatılamadı.");
            }

            setMessageType("success");
            setMessage(
              `${payload.products ?? 0} urun ve ${payload.orders ?? 0} siparis senkronize edildi.`,
            );
            router.refresh();
          } catch (error) {
            setMessageType("error");
            setMessage(error instanceof Error ? error.message : "İşlem başarısız.");
          } finally {
            setPending(false);
          }
        }}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#2f6bff] px-4 text-sm font-semibold text-white transition hover:bg-[#2158d9] disabled:opacity-70"
      >
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {pending ? "Senkronize ediliyor..." : "Senkronize Et"}
      </button>
      {message ? (
        <div
          className={`flex max-w-[260px] items-start gap-2 rounded-2xl px-3 py-2 text-xs ${
            messageType === "success"
              ? "bg-emerald-50 text-emerald-700"
              : messageType === "error"
                ? "bg-rose-50 text-rose-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : messageType === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          )}
          <p>{message}</p>
        </div>
      ) : null}
    </div>
  );
}
