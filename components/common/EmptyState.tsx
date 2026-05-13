import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card-shadow flex min-h-[240px] flex-col items-center justify-center rounded-[28px] border border-slate-200/70 bg-white px-6 py-10 text-center">
      <div className="mb-4 rounded-full bg-[#eaf1ff] p-4 text-[#2f6bff]">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="font-heading text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
