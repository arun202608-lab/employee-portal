import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Topbar from "../components/Topbar";

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const getList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["permissions", "data", "results"]) {
    if (Array.isArray(payload[key])) return payload[key];
    const nested = getList(payload[key]);
    if (nested.length) return nested;
  }
  return [];
};

const emptyForm = { name: "", description: "", resource: "", action: "", isActive: true };

const PermissionSkeleton = () => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="min-w-[760px]">
      <div className="grid grid-cols-6 gap-4 border-b border-slate-200 px-5 py-3"><span className="h-2 w-24 animate-pulse rounded bg-slate-200" /><span className="h-2 w-16 animate-pulse rounded bg-slate-200" /><span className="h-2 w-12 animate-pulse rounded bg-slate-200" /><span className="h-2 w-24 animate-pulse rounded bg-slate-200" /><span className="h-2 w-12 animate-pulse rounded bg-slate-200" /><span /></div>
      {Array.from({ length: 7 }).map((_, index) => <div key={index} className="grid grid-cols-6 items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-0"><span className="h-3 w-36 animate-pulse rounded bg-slate-100" /><span className="h-3 w-20 animate-pulse rounded bg-slate-100" /><span className="h-3 w-14 animate-pulse rounded bg-slate-100" /><span className="h-3 w-28 animate-pulse rounded bg-slate-100" /><span className="h-6 w-16 animate-pulse rounded-full bg-slate-100" /><span className="h-7 w-20 animate-pulse rounded bg-slate-100" /></div>)}
    </div>
  </div>
);

const PermissionModal = ({ mode, form, saving, onChange, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="permission-modal-title" className="my-4 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 id="permission-modal-title" className="text-lg font-semibold text-slate-900">{mode === "create" ? "Create permission" : "Edit permission"}</h2><p className="mt-1 text-sm text-slate-500">Define a specific access action for the portal.</p></div><button type="button" aria-label="Close permission modal" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div>
      <form onSubmit={onSubmit} className="space-y-4 px-5 py-5 sm:px-6">
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Permission Name</span><input required value={form.name} onChange={(event) => onChange("name", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Description</span><textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} rows="3" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Resource</span><input value={form.resource} onChange={(event) => onChange("resource", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Action</span><input value={form.action} onChange={(event) => onChange("action", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label></div>
        <label className="flex items-center gap-3 py-1 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => onChange("isActive", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />Active</label>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">{saving ? "Saving..." : mode === "create" ? "Create permission" : "Save changes"}</button></div>
      </form>
    </section>
  </div>
);

const Permissions = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = readStoredUser();
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [viewingPermission, setViewingPermission] = useState(null);
  const [deletingPermission, setDeletingPermission] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");

  const config = useCallback((signal) => ({ signal, headers: { Authorization: `Bearer ${token}` } }), [token]);
  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/", { replace: true });
      return true;
    }
    if (error.response?.status === 403) {
      setAccessRestricted(true);
      return true;
    }
    return false;
  }, [navigate]);

  const loadPermissions = useCallback(async (signal) => {
    setLoading(true);
    setRequestError(false);
    try {
      const response = await api.get("/permissions/permissions", config(signal));
      if (response.data?.success === false) throw new Error("Request failed");
      setPermissions(getList(response.data?.permissions ?? response.data?.data ?? response.data));
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
      if (!handleAuthError(error)) setRequestError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [config, handleAuthError]);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    // The initial request synchronizes this page with the backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPermissions(controller.signal);
    return () => controller.abort();
  }, [loadPermissions, token]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return permissions.filter((permission) => {
      const matchesSearch = !query || [permission.name, permission.description, permission.resource, permission.action].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus = status === "All" || (status === "Active" ? permission.isActive !== false : permission.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [permissions, search, status]);

  const activePermissions = permissions.filter((permission) => permission.isActive !== false).length;
  const resources = new Set(permissions.map((permission) => permission.resource).filter(Boolean)).size;
  const openCreate = () => { setEditingPermission(null); setForm(emptyForm); setModalMode("create"); };
  const openEdit = (permission) => { setEditingPermission(permission); setForm({ name: permission.name || "", description: permission.description || "", resource: permission.resource || "", action: permission.action || "", isActive: permission.isActive !== false }); setModalMode("edit"); };
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitPermission = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim(), description: form.description.trim(), resource: form.resource.trim(), action: form.action.trim() };
      if (modalMode === "create") { await api.post("/permissions/permissions", payload, config()); setToast("Permission created successfully"); }
      else { await api.put(`/permissions/permissions/${editingPermission.id || editingPermission._id}`, payload, config()); setToast("Permission updated successfully"); }
      setModalMode(null);
      await loadPermissions();
    } catch (error) {
      handleAuthError(error);
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      const permissionId = deletingPermission.id || deletingPermission._id;
      await api.delete(`/permissions/permissions/${permissionId}`, config());
      setDeletingPermission(null);
      setToast("Permission deleted successfully");
      await loadPermissions();
    } catch (error) { handleAuthError(error); }
    finally { setSaving(false); }
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/", { replace: true }); };
  if (!token) return <Navigate to="/" replace />;
  const shell = (content) => <div className="min-h-screen bg-slate-50 text-slate-900"><Sidebar isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} onLogout={logout} /><div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}><Topbar title="Permissions" user={user} onMenuClick={() => setSidebarOpen(true)} />{content}</div>{toast && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg"><CheckCircle2 size={17} className="text-emerald-600" />{toast}</div>}</div>;

  if (accessRestricted) return shell(<main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-10"><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><ShieldAlert size={23} /></div><h2 className="mt-5 text-xl font-semibold text-slate-900">Access restricted</h2><p className="mt-2 text-sm leading-6 text-slate-500">You don&apos;t have permission to manage permissions.</p><button type="button" onClick={() => navigate("/dashboard")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><ArrowLeft size={16} /> Back to Dashboard</button></div></main>);

  return shell(<main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
    <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-medium text-blue-700">Access workspace</p><h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Permissions</h2><p className="mt-2 text-sm text-slate-500">Define and manage access permissions across your employee portal.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"><Plus size={17} /> Create permission</button></section>
    <section className="grid gap-4 py-7 md:grid-cols-3"><StatCard label="Total Permissions" value={loading ? "-" : permissions.length} supportingText="Defined in the workspace" icon={KeyRound} accent="bg-blue-50 text-blue-700" /><StatCard label="Active Permissions" value={loading ? "-" : activePermissions} supportingText="Currently enabled" icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" /><StatCard label="Resources" value={loading ? "-" : resources} supportingText="Across the workspace" icon={ShieldAlert} accent="bg-amber-50 text-amber-700" /></section>
    <section className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><label className="relative w-full sm:max-w-sm"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label><div className="flex items-center gap-3"><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option>All</option><option>Active</option><option>Inactive</option></select><button type="button" aria-label="Refresh permissions" onClick={() => loadPermissions()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button></div></section>
    {loading ? <PermissionSkeleton /> : requestError ? <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">Unable to load permissions</h3><p className="mt-1 text-sm text-slate-500">Please try again.</p><button type="button" onClick={() => loadPermissions()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><RefreshCw size={15} /> Retry</button></div> : filteredPermissions.length ? <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-[760px] w-full text-left"><thead><tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-3">Permission</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead><tbody>{filteredPermissions.map((permission, index) => <tr key={permission._id || permission.id || `${permission.name}-${index}`} className="border-b border-slate-100 text-sm transition-colors hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-800">{permission.name || "N/A"}</td><td className="px-5 py-4 text-slate-500">{permission.resource || "N/A"}</td><td className="px-5 py-4 text-slate-500">{permission.action || "N/A"}</td><td className="max-w-xs px-5 py-4 text-slate-500">{permission.description || "N/A"}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${permission.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${permission.isActive !== false ? "bg-emerald-500" : "bg-slate-400"}`} />{permission.isActive !== false ? "Active" : "Inactive"}</span></td><td className="px-5 py-4"><div className="flex items-center gap-1"><button type="button" onClick={() => setViewingPermission(permission)} className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">View</button><button type="button" onClick={() => openEdit(permission)} aria-label={`Edit ${permission.name}`} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50"><Edit3 size={15} /></button><button type="button" onClick={() => setDeletingPermission(permission)} aria-label={`Delete ${permission.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><KeyRound size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">No permissions found</h3><p className="mt-1 text-sm text-slate-500">Create a permission to start managing access.</p></div>}
    {modalMode && <PermissionModal mode={modalMode} form={form} saving={saving} onChange={updateForm} onSubmit={submitPermission} onClose={() => setModalMode(null)} />}
    {viewingPermission && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && setViewingPermission(null)}><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between border-b border-slate-100 pb-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><KeyRound size={19} /></div><div><h2 className="font-semibold text-slate-900">{viewingPermission.name || "N/A"}</h2><p className="mt-1 text-sm text-slate-500">Permission details</p></div></div><button type="button" aria-label="Close permission details" onClick={() => setViewingPermission(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><dl className="grid gap-4 py-5 sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Description</dt><dd className="mt-1 text-sm text-slate-700">{viewingPermission.description || "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Status</dt><dd className="mt-1 text-sm text-slate-700">{viewingPermission.isActive !== false ? "Active" : "Inactive"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Resource</dt><dd className="mt-1 text-sm text-slate-700">{viewingPermission.resource || "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Action</dt><dd className="mt-1 text-sm text-slate-700">{viewingPermission.action || "N/A"}</dd></div></dl></section></div>}
    {deletingPermission && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Delete permission?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Are you sure you want to delete this permission?</p></div><button type="button" aria-label="Close delete confirmation" onClick={() => setDeletingPermission(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeletingPermission(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button><button type="button" disabled={saving} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"><Trash2 size={15} />{saving ? "Deleting..." : "Delete permission"}</button></div></section></div>}
  </main>);
};

export default Permissions;
