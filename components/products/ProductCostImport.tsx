"use client";

import { useState } from "react";

type ProductCostImportProps = {
  storeId: string;
};

export function ProductCostImport({ storeId }: ProductCostImportProps) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="font-heading text-xl font-bold text-slate-900">Toplu maliyet içe aktar</h3>
        <p className="mt-1 text-sm text-slate-500">
          Her satıra `barcode,cost` formatında veri girin.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-[170px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
        placeholder={"868000000001,120.5\n868000000002,88.9"}
      />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            try {
              setPending(true);
              setMessage(null);

              const rows = value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [barcode, cost] = line.split(",");
                  return {
                    barcode: barcode.trim(),
                    cost: Number(cost),
                  };
                });

              const response = await fetch(`/api/stores/${storeId}/cost-import`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ rows }),
              });

              const payload = await response.json();
              if (!response.ok) throw new Error(payload.error ?? "İçe aktarma başarısız.");
              setMessage(`${payload.updated} ürün maliyeti güncellendi.`);
              setValue("");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "İşlem başarısız.");
            } finally {
              setPending(false);
            }
          }}
          className="rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
        >
          İçe Aktar
        </button>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </div>
    </div>
  );
}
