import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";
import RoleCard from "../components/RoleCard";
import RoleModal from "../components/RoleModal";
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

const getList = (payload, keys) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
    if (payload[key] && typeof payload[key] === "object") {
      const nested = getList(payload[key], keys);
      if (nested.length) return nested;
    }
  }
  return [];
};

const toId = (value) => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value?._id || value?.id || value?.$oid || "";
};

const normalizePermission = (permission) => ({
  id: toId(permission),
  name: permission?.name || String(permission?.label || permission || "Permission"),
});

const normalizeRole = (role, permissions) => {
  const permissionValues = Array.isArray(role?.permissions) ? role.permissions : [];
  const normalizedPermissionIds = permissionValues.map(toId).filter(Boolean);
  const normalizedPermissions = permissionValues.map((permission) => {
    const permissionId = toId(permission);
    return typeof permission === "object" && permission?.name
      ? { id: permissionId, name: permission.name }
      : permissions.find((item) => item.id === permissionId) || {
          id: permissionId,
          name: permissionId || "Permission",
        };
  });

  return {
    id: toId(role),
    name: role?.name || "Unnamed role",
    description: role?.description || "",
    isActive: role?.isActive !== false,
    permissions: normalizedPermissions,
    permissionIds: normalizedPermissionIds,
  };
};

const emptyForm = { name: "", description: "", isActive: true, permissions: [] };

const RoleSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="min-h-56 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-2"><span className="block h-3 w-28 animate-pulse rounded bg-slate-200" /><span className="block h-2 w-16 animate-pulse rounded bg-slate-100" /></div>
        </div>
        <span className="mt-6 block h-3 w-full animate-pulse rounded bg-slate-100" />
        <span className="mt-2 block h-3 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="mt-10 border-t border-slate-100 pt-4"><span className="block h-7 w-32 animate-pulse rounded bg-slate-100" /></div>
      </div>
    ))}
  </div>
);

const Roles = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = readStoredUser();
  const [roles, setRoles] = useState([]);
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
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");

  const authConfig = useCallback(
    (signal) => ({
      signal,
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token],
  );

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

  const fetchRoles = useCallback(async (signal) => {
    const response = await api.get("/roles/roles", authConfig(signal));
    return getList(response.data?.roles ?? response.data?.data ?? response.data, ["roles", "data"]);
  }, [authConfig]);

  const fetchPermissions = useCallback(async (signal) => {
    const response = await api.get("/permissions/permissions", authConfig(signal));
    return getList(response.data?.permissions ?? response.data?.data ?? response.data, ["permissions", "data"]);
  }, [authConfig]);

  const loadData = useCallback(async (signal) => {
    setLoading(true);
    setRequestError(false);
    setAccessRestricted(false);
    try {
      const [roleRecords, permissionRecords] = await Promise.all([
        fetchRoles(signal),
        fetchPermissions(signal),
      ]);
      const availablePermissions = permissionRecords.map(normalizePermission).filter((permission) => permission.id);
      setPermissions(availablePermissions);
      setRoles(roleRecords.map((role) => normalizeRole(role, availablePermissions)));
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
      if (!handleAuthError(error)) setRequestError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [fetchPermissions, fetchRoles, handleAuthError]);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    // The initial request synchronizes this page with the backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData, token]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roles.filter((role) => {
      const matchesSearch = !query || role.name.toLowerCase().includes(query) || role.description.toLowerCase().includes(query);
      const matchesStatus = status === "All" || (status === "Active" ? role.isActive : !role.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [roles, search, status]);

  const activeRoles = roles.filter((role) => role.isActive).length;
  const assignedPermissions = new Set(roles.flatMap((role) => role.permissionIds)).size;

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setModalMode("create");
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      permissions: role.permissionIds,
    });
    setModalMode("edit");
  };

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const togglePermission = (permissionId) => setForm((current) => ({
    ...current,
    permissions: current.permissions.includes(permissionId)
      ? current.permissions.filter((id) => id !== permissionId)
      : [...current.permissions, permissionId],
  }));

  const submitRole = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
        permissions: form.permissions,
      };
      if (modalMode === "create") {
        await api.post("/roles/roles", payload, authConfig());
        setToast("Role created successfully");
      } else {
        await api.put(`/roles/roles/${editingRole.id}`, payload, authConfig());
        setToast("Role updated successfully");
      }
      setModalMode(null);
      await loadData();
    } catch (error) {
      if (!handleAuthError(error) && error.response?.status !== 403) setRequestError(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/roles/roles/${deletingRole.id}`, authConfig());
      setDeletingRole(null);
      setToast("Role deleted successfully");
      await loadData();
    } catch (error) {
      handleAuthError(error);
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  if (!token) return <Navigate to="/" replace />;

  const shell = (content) => (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} onLogout={logout} />
      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <Topbar title="Roles" user={user} onMenuClick={() => setSidebarOpen(true)} />
        {content}
      </div>
      {toast && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg"><CheckCircle2 size={17} className="text-emerald-600" />{toast}</div>}
    </div>
  );

  if (accessRestricted) {
    return shell(
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><ShieldAlert size={23} /></div>
          <h2 className="mt-5 text-xl font-semibold text-slate-900">Access restricted</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">You don&apos;t have permission to manage roles.</p>
          <button type="button" onClick={() => navigate("/dashboard")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"><ArrowLeft size={16} /> Back to Dashboard</button>
        </div>
      </main>,
    );
  }

  return shell(
    <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
      <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-700">Access workspace</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Roles</h2>
          <p className="mt-2 text-sm text-slate-500">Manage roles and control access across your employee portal.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"><Plus size={17} /> Create role</button>
      </section>

      <section className="grid gap-4 py-7 md:grid-cols-3">
        <StatCard label="Total Roles" value={loading ? "-" : roles.length} supportingText="Defined in the workspace" icon={ShieldCheck} accent="bg-blue-50 text-blue-700" />
        <StatCard label="Active Roles" value={loading ? "-" : activeRoles} supportingText="Currently enabled" icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" />
        <StatCard label="Assigned Permissions" value={loading ? "-" : assignedPermissions} supportingText="Unique permissions in use" icon={KeyRound} accent="bg-amber-50 text-amber-700" />
      </section>

      <section className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-sm"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
        <div className="flex items-center gap-3"><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option>All</option><option>Active</option><option>Inactive</option></select><button type="button" onClick={() => loadData()} disabled={loading} aria-label="Refresh roles" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button></div>
      </section>

      {loading ? <RoleSkeleton /> : requestError ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">Unable to load roles</h3><p className="mt-1 text-sm text-slate-500">Please try again.</p><button type="button" onClick={() => loadData()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"><RefreshCw size={15} /> Retry</button></div>
      ) : filteredRoles.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredRoles.map((role) => <RoleCard key={role.id || role.name} role={role} onView={setViewingRole} onEdit={openEdit} onDelete={setDeletingRole} />)}</section>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><ShieldCheck size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">No roles found</h3><p className="mt-1 text-sm text-slate-500">Create your first role to start managing access.</p></div>
      )}

      {modalMode && <RoleModal mode={modalMode} permissions={permissions} form={form} loading={saving} onChange={updateForm} onTogglePermission={togglePermission} onSubmit={submitRole} onClose={() => setModalMode(null)} />}

      {viewingRole && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && setViewingRole(null)}><section role="dialog" aria-modal="true" aria-labelledby="view-role-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between border-b border-slate-100 pb-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><ShieldCheck size={21} /></div><div><h2 id="view-role-title" className="font-semibold text-slate-900">{viewingRole.name}</h2><p className="mt-1 text-sm text-slate-500">Role details</p></div></div><button type="button" aria-label="Close role details" onClick={() => setViewingRole(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div><p className="py-5 text-sm leading-6 text-slate-600">{viewingRole.description || "No description provided."}</p><div className="flex items-center gap-2 border-y border-slate-100 py-4 text-sm"><span className={`h-2 w-2 rounded-full ${viewingRole.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />Status: <span className="font-medium text-slate-800">{viewingRole.isActive ? "Active" : "Inactive"}</span></div><div className="pt-5"><h3 className="text-sm font-semibold text-slate-800">Permissions</h3>{viewingRole.permissions.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{viewingRole.permissions.map((permission, index) => <li key={`${permission.id}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{permission.name}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No permissions assigned.</p>}</div></section></div>}

      {deletingRole && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-role-title" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="delete-role-title" className="text-lg font-semibold text-slate-900">Delete role?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Are you sure you want to delete this role?</p></div><button type="button" aria-label="Close delete confirmation" onClick={() => setDeletingRole(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeletingRole(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button><button type="button" disabled={saving} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"><Trash2 size={15} />{saving ? "Deleting..." : "Delete role"}</button></div></section></div>}
    </main>,
  );
};

export default Roles;
