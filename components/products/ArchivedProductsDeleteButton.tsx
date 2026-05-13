"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, Trash2 } from "lucide-react";

type ArchivedProductsDeleteButtonProps = {
  storeId: string;
};

type MessageState = {
  text: string;
  type: "success" | "error" | "info";
};

type CleanupResponse = {
  found: number;
  deleted: number;
  failed: number;
  pending: number;
  failures?: Array<{
    barcode: string;
    message: string;
  }>;
};

function buildMessage(payload: CleanupResponse): MessageState {
  if (payload.found === 0) {
    return {
      type: "info",
      text: "Trendyol arşivinde silinecek ürün bulunamadı.",
    };
  }

  if (payload.deleted > 0 && payload.failed === 0 && payload.pending === 0) {
    return {
      type: "success",
      text: `${payload.deleted} arşivlenmiş ürün Trendyol'dan silindi.`,
    };
  }

  const failureDetail = payload.failures?.[0]
    ? ` İlk hata: ${payload.failures[0].barcode} - ${payload.failures[0].message}`
    : "";

  return {
    type: payload.deleted > 0 ? "success" : "error",
    text:
      `${payload.found} arşiv ürün bulundu, ${payload.deleted} silindi, ` +
      `${payload.failed} başarısız, ${payload.pending} beklemede.${failureDetail}`,
  };
}

export function ArchivedProductsDeleteButton({
  storeId,
}: ArchivedProductsDeleteButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Yalnızca Trendyol arşivindeki ürünler silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setPending(true);
      setMessage({
        type: "info",
        text: "Trendyol arşivindeki ürünler taranıyor ve siliniyor...",
      });

      const response = await fetch(`/api/stores/${storeId}/products/archive-cleanup`, {
        method: "POST",
      });
      const payload = (await response.json()) as CleanupResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Arşiv ürünleri silinemedi.");
      }

      setMessage(buildMessage(payload));
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Arşiv ürünleri silinemedi.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {pending ? "Arşiv siliniyor..." : "Arşivdekileri Sil"}
      </button>
      <p className="text-right text-xs text-slate-400">
        Sadece Trendyol&apos;da arşivlenmiş ürünler hedeflenir.
      </p>
      {message ? (
        <div
          className={`max-w-[380px] rounded-2xl px-3 py-2 text-xs ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : message.type === "error"
                ? "bg-rose-50 text-rose-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          <div className="flex items-start gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : message.type === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
