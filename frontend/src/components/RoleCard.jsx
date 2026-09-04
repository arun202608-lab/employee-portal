import { Edit3, Eye, KeyRound, Trash2 } from "lucide-react";

const RoleCard = ({ role, onView, onEdit, onDelete }) => (
  <article className="group flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <KeyRound size={19} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">{role.name}</h2>
          <span className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${role.isActive ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${role.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
            {role.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-400">
        {role.permissions.length} {role.permissions.length === 1 ? "permission" : "permissions"}
      </span>
    </div>

    <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
      {role.description || "No description provided."}
    </p>

    <div className="mt-auto flex items-center gap-1 border-t border-slate-100 pt-4">
      <button type="button" onClick={() => onView(role)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
        <Eye size={15} /> View
      </button>
      <button type="button" onClick={() => onEdit(role)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50 hover:text-blue-900">
        <Edit3 size={15} /> Edit
      </button>
      <button type="button" onClick={() => onDelete(role)} aria-label={`Delete ${role.name}`} className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700">
        <Trash2 size={15} />
      </button>
    </div>
  </article>
);

export default RoleCard;
