"use client";

import { useState } from "react";

type ProductCostEditorProps = {
  storeId: string;
  productId: string;
  initialCost: number;
};

export function ProductCostEditor({
  storeId,
  productId,
  initialCost,
}: ProductCostEditorProps) {
  const [cost, setCost] = useState(initialCost.toString());
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        value={cost}
        onChange={(event) => setCost(event.target.value)}
        className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm"
      />
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          try {
            setPending(true);
            setStatus(null);
            const response = await fetch(
              `/api/stores/${storeId}/products/${productId}/cost`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ cost: Number(cost) }),
              },
            );
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? "Güncelleme başarısız.");
            setStatus("Kaydedildi");
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "İşlem başarısız.");
          } finally {
            setPending(false);
          }
        }}
        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
      >
        Kaydet
      </button>
      {status ? <span className="text-xs text-slate-500">{status}</span> : null}
    </div>
  );
}
