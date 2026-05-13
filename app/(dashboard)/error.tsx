"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card-shadow rounded-[28px] border border-rose-200 bg-white p-8">
      <h2 className="font-heading text-2xl font-bold text-slate-900">
        Panel yüklenirken bir sorun oluştu
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
