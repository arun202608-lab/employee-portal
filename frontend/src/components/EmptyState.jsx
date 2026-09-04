import { UsersRound } from "lucide-react";

const EmptyState = ({ title = "No employees found", message = "Try changing your search or filters." }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
      <UsersRound size={22} strokeWidth={1.8} />
    </div>
    <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
  </div>
);

export default EmptyState;
