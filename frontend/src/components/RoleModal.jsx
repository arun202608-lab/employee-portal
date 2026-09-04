import { Check, X } from "lucide-react";

const RoleModal = ({ mode, permissions, form, loading, onChange, onTogglePermission, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4 sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="role-modal-title" className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h2 id="role-modal-title" className="text-lg font-semibold text-slate-900">{mode === "create" ? "Create role" : "Edit role"}</h2>
          <p className="mt-1 text-sm text-slate-500">Define access for this workspace role.</p>
        </div>
        <button type="button" aria-label="Close role modal" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
      </div>

      <form onSubmit={onSubmit} className="overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Role Name</span>
            <input required value={form.name} onChange={(event) => onChange("name", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} rows="3" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={form.isActive} onChange={(event) => onChange("isActive", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Active status
          </label>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Permissions</h3>
              <p className="mt-1 text-xs text-slate-500">Select the access this role should have.</p>
            </div>
            <span className="text-xs font-medium text-slate-400">{form.permissions.length} selected</span>
          </div>
          {permissions.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {permissions.map((permission) => {
                const checked = form.permissions.includes(permission.id);
                return (
                  <label key={permission.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${checked ? "border-blue-200 bg-blue-50/60 text-blue-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <input type="checkbox" checked={checked} onChange={() => onTogglePermission(permission.id)} className="sr-only" />
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>{checked && <Check size={12} strokeWidth={3} />}</span>
                    <span className="truncate">{permission.name}</span>
                  </label>
                );
              })}
            </div>
          ) : <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No permissions available.</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Saving..." : mode === "create" ? "Create role" : "Save changes"}</button>
        </div>
      </form>
    </section>
  </div>
);

export default RoleModal;
