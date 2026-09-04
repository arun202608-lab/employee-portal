import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  Users as UsersIcon,
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

const getId = (value) => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value?._id || value?.id || value?.$oid || "";
};

const normalizeRole = (role) => ({
  id: getId(role),
  name: typeof role === "object" ? role?.name || "Unnamed role" : "Assigned role",
});

const normalizeUser = (user) => ({
  ...user,
  id: getId(user),
  name: user?.name || "Unnamed user",
  email: user?.email || "N/A",
  department: user?.department || "N/A",
  isActive: user?.isActive !== false,
  roles: Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [],
});

const emptyForm = {
  name: "",
  email: "",
  password: "",
  department: "",
  isActive: true,
  roles: [],
};

const UserSkeleton = () => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="min-w-[850px]">
      <div className="grid grid-cols-6 gap-4 border-b border-slate-200 px-5 py-3">
        {Array.from({ length: 6 }).map((_, index) => <span key={index} className="h-2 w-16 animate-pulse rounded bg-slate-200" />)}
      </div>
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="grid grid-cols-6 items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-0">
          {Array.from({ length: 6 }).map((__, column) => <span key={column} className={`h-3 animate-pulse rounded bg-slate-100 ${column === 0 ? "w-28" : "w-20"}`} />)}
        </div>
      ))}
    </div>
  </div>
);

const UserModal = ({ mode, form, roles, saving, onChange, onToggleRole, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="user-modal-title" className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div><h2 id="user-modal-title" className="text-lg font-semibold text-slate-900">{mode === "create" ? "Create user" : "Edit user"}</h2><p className="mt-1 text-sm text-slate-500">Manage account access and assigned roles.</p></div>
        <button type="button" aria-label="Close user modal" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
      </div>
      <form onSubmit={onSubmit} className="overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Full Name</span><input required value={form.name} onChange={(event) => onChange("name", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
          <label><span className="mb-2 block text-sm font-medium text-slate-700">Email</span><input required type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
          <label><span className="mb-2 block text-sm font-medium text-slate-700">Department</span><input value={form.department} onChange={(event) => onChange("department", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">{mode === "create" ? "Password" : "New Password (optional)"}</span><input required={mode === "create"} type="password" value={form.password} onChange={(event) => onChange("password", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700 sm:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(event) => onChange("isActive", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />Active status</label>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Roles</h3><p className="mt-1 text-xs text-slate-500">Assign one or more workspace roles.</p></div><span className="text-xs text-slate-400">{form.roles.length} selected</span></div>{roles.length ? <div className="grid gap-2 sm:grid-cols-2">{roles.map((role) => { const checked = form.roles.includes(role.id); return <label key={role.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${checked ? "border-blue-200 bg-blue-50/60 text-blue-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><input type="checkbox" checked={checked} onChange={() => onToggleRole(role.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />{role.name}</label>; })}</div> : <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No roles available.</p>}</div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">{saving ? "Saving..." : mode === "create" ? "Create user" : "Save changes"}</button></div>
      </form>
    </section>
  </div>
);

const Users = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = readStoredUser();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [department, setDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");

  const config = useCallback((signal) => ({ signal, headers: { Authorization: `Bearer ${token}` } }), [token]);
  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/", { replace: true }); return true; }
    if (error.response?.status === 403) { setAccessRestricted(true); return true; }
    return false;
  }, [navigate]);

  const loadData = useCallback(async (signal) => {
    setLoading(true); setRequestError(false); setAccessRestricted(false);
    try {
      const [userResponse, roleResponse] = await Promise.all([api.get("/users/users", config(signal)), api.get("/roles/roles", config(signal))]);
      if (userResponse.data?.success === false || roleResponse.data?.success === false) throw new Error("Request failed");
      const roleRecords = getList(roleResponse.data?.roles ?? roleResponse.data?.data ?? roleResponse.data, ["roles", "data"]);
      const normalizedRoles = roleRecords.map(normalizeRole).filter((role) => role.id);
      setRoles(normalizedRoles);
      const userRecords = getList(userResponse.data?.users ?? userResponse.data?.data ?? userResponse.data, ["users", "data"]);
      setUsers(userRecords.map(normalizeUser));
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
      if (!handleAuthError(error)) setRequestError(true);
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [config, handleAuthError]);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    // Initial request synchronizes this page with the backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData, token]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const departments = useMemo(() => ["All", ...new Set(users.map((user) => user.department).filter((value) => value !== "N/A"))], [users]);
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || [user.name, user.email, user.department].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = status === "All" || (status === "Active" ? user.isActive : !user.isActive);
      return matchesSearch && matchesStatus && (department === "All" || user.department === department);
    });
  }, [department, search, status, users]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleRole = (roleId) => setForm((current) => ({ ...current, roles: current.roles.includes(roleId) ? current.roles.filter((id) => id !== roleId) : [...current.roles, roleId] }));
  const openCreate = () => { setEditingUser(null); setForm(emptyForm); setModalMode("create"); };
  const openEdit = (user) => { setEditingUser(user); setForm({ name: user.name === "Unnamed user" ? "" : user.name, email: user.email === "N/A" ? "" : user.email, password: "", department: user.department === "N/A" ? "" : user.department, isActive: user.isActive, roles: user.roles.map((role) => role.id).filter(Boolean) }); setModalMode("edit"); };

  const submitUser = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim().toLowerCase(), department: form.department.trim(), isActive: form.isActive, roles: form.roles };
      if (modalMode === "create") { payload.password = form.password; await api.post("/users/users", payload, config()); setToast("User created successfully"); }
      else { if (form.password) payload.password = form.password; await api.put(`/users/users/${editingUser.id}`, payload, config()); setToast("User updated successfully"); }
      setModalMode(null); await loadData();
    } catch (error) { handleAuthError(error); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try { await api.delete(`/users/users/${deletingUser.id}`, config()); setDeletingUser(null); setToast("User deleted successfully"); await loadData(); }
    catch (error) { handleAuthError(error); }
    finally { setSaving(false); }
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/", { replace: true }); };
  const isCurrentUser = deletingUser && storedUser && getId(storedUser) === deletingUser.id;
  if (!token) return <Navigate to="/" replace />;
  const shell = (content) => <div className="min-h-screen bg-slate-50 text-slate-900"><Sidebar isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} onLogout={logout} /><div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}><Topbar title="Employees & Users" user={storedUser} onMenuClick={() => setSidebarOpen(true)} />{content}</div>{toast && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg"><CheckCircle2 size={17} className="text-emerald-600" />{toast}</div>}</div>;

  if (accessRestricted) return shell(<main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-10"><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><ShieldAlert size={23} /></div><h2 className="mt-5 text-xl font-semibold text-slate-900">Access restricted</h2><p className="mt-2 text-sm leading-6 text-slate-500">You don&apos;t have permission to manage users.</p><button type="button" onClick={() => navigate("/dashboard")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><ArrowLeft size={16} /> Back to Dashboard</button></div></main>);

  return shell(<main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10"><section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-medium text-blue-700">People workspace</p><h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Employees &amp; Users</h2><p className="mt-2 text-sm text-slate-500">Manage portal users, departments, roles and account access.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"><Plus size={17} /> Create user</button></section>
    <section className="grid gap-4 py-7 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total Users" value={loading ? "-" : users.length} supportingText="Portal accounts" icon={UsersIcon} accent="bg-blue-50 text-blue-700" /><StatCard label="Active Users" value={loading ? "-" : users.filter((user) => user.isActive).length} supportingText="Currently enabled" icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" /><StatCard label="Inactive Users" value={loading ? "-" : users.filter((user) => !user.isActive).length} supportingText="Access disabled" icon={ShieldAlert} accent="bg-amber-50 text-amber-700" /><StatCard label="Departments" value={loading ? "-" : Math.max(departments.length - 1, 0)} supportingText="Across the workspace" icon={UserRound} accent="bg-slate-100 text-slate-700" /></section>
    <section className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"><label className="relative w-full lg:max-w-sm"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label><div className="flex flex-wrap items-center gap-3"><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option>All</option><option>Active</option><option>Inactive</option></select><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">{departments.map((value) => <option key={value}>{value}</option>)}</select><button type="button" aria-label="Refresh users" onClick={() => loadData()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button></div></section>
    {loading ? <UserSkeleton /> : requestError ? <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">Unable to load users</h3><p className="mt-1 text-sm text-slate-500">Please try again.</p><button type="button" onClick={() => loadData()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><RefreshCw size={15} /> Retry</button></div> : filteredUsers.length ? <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-[850px] w-full text-left"><thead><tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-3">User</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead><tbody>{filteredUsers.map((user, index) => <tr key={user.id || `${user.email}-${index}`} className="border-b border-slate-100 text-sm transition-colors hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{user.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="font-medium text-slate-800">{user.name}</span></div></td><td className="px-5 py-4 text-slate-500"><span className="flex items-center gap-1.5"><Mail size={14} />{user.email}</span></td><td className="px-5 py-4 text-slate-500">{user.department}</td><td className="px-5 py-4 text-slate-500">{user.roles.length ? user.roles.map((role) => role.name).join(", ") : "N/A"}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />{user.isActive ? "Active" : "Inactive"}</span></td><td className="px-5 py-4"><div className="flex items-center gap-1"><button type="button" onClick={() => setViewingUser(user)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`View ${user.name}`}><UserRound size={15} /></button><button type="button" onClick={() => openEdit(user)} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50" aria-label={`Edit ${user.name}`}><Edit3 size={15} /></button><button type="button" onClick={() => setDeletingUser(user)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${user.name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><UsersIcon size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">No users found</h3><p className="mt-1 text-sm text-slate-500">Create your first user to get started.</p></div>}
    {modalMode && <UserModal mode={modalMode} form={form} roles={roles} saving={saving} onChange={updateForm} onToggleRole={toggleRole} onSubmit={submitUser} onClose={() => setModalMode(null)} />}
    {viewingUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && setViewingUser(null)}><section role="dialog" aria-modal="true" aria-labelledby="view-user-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between border-b border-slate-100 pb-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700"><UserRound size={20} /></div><div><h2 id="view-user-title" className="font-semibold text-slate-900">{viewingUser.name}</h2><p className="mt-1 text-sm text-slate-500">User details</p></div></div><button type="button" aria-label="Close user details" onClick={() => setViewingUser(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><dl className="grid gap-5 py-6 sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Email</dt><dd className="mt-1 text-sm text-slate-700">{viewingUser.email}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Department</dt><dd className="mt-1 text-sm text-slate-700">{viewingUser.department}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Roles</dt><dd className="mt-1 text-sm text-slate-700">{viewingUser.roles.length ? viewingUser.roles.map((role) => role.name).join(", ") : "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Status</dt><dd className="mt-1 text-sm text-slate-700">{viewingUser.isActive ? "Active" : "Inactive"}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Created date</dt><dd className="mt-1 text-sm text-slate-700">{viewingUser.createdAt ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(viewingUser.createdAt)) : "N/A"}</dd></div></dl></section></div>}
    {deletingUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-user-title" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="delete-user-title" className="text-lg font-semibold text-slate-900">Delete user?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Are you sure you want to remove this user from the portal?</p>{isCurrentUser && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">This is your current account. Deleting it will end your access.</p>}</div><button type="button" aria-label="Close delete confirmation" onClick={() => setDeletingUser(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeletingUser(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button><button type="button" disabled={saving} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"><Trash2 size={15} />{saving ? "Deleting..." : "Delete user"}</button></div></section></div>}
  </main>);
};

export default Users;
