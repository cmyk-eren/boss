export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-[28px] bg-white/80" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[28px] bg-white/80" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-[420px] animate-pulse rounded-[28px] bg-white/80" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    </div>
  );
}
