"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

type SyncButtonProps = {
  storeId?: string;
};

export function SyncButton({ storeId }: SyncButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
            setMessage(null);

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

            setMessage("Senkronizasyon tamamlandı.");
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "İşlem başarısız.");
          } finally {
            setPending(false);
          }
        }}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#2f6bff] px-4 text-sm font-semibold text-white transition hover:bg-[#2158d9] disabled:opacity-70"
      >
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Senkronize Et
      </button>
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
