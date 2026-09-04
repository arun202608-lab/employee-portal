import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileClock,
  RefreshCw,
  Search,
  ShieldAlert,
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
  for (const key of ["logs", "data", "results"])
    if (Array.isArray(payload[key])) return payload[key];
  return [];
};

const getUserName = (user) => user?.name || "System";
const getStatus = (statusCode) => Number(statusCode) >= 200 && Number(statusCode) < 300;
const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const actionClass = {
  view: "bg-blue-50 text-blue-700",
  create: "bg-emerald-50 text-emerald-700",
  edit: "bg-amber-50 text-amber-700",
  delete: "bg-red-50 text-red-700",
};

const LogSkeleton = () => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="min-w-[980px]">
      <div className="grid grid-cols-7 gap-4 border-b border-slate-200 px-5 py-3">{Array.from({ length: 7 }).map((_, index) => <span key={index} className="h-2 w-16 animate-pulse rounded bg-slate-200" />)}</div>
      {Array.from({ length: 8 }).map((_, index) => <div key={index} className="grid grid-cols-7 items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-0">{Array.from({ length: 7 }).map((__, column) => <span key={column} className={`h-3 animate-pulse rounded bg-slate-100 ${column === 0 ? "w-24" : "w-16"}`} />)}</div>)}
    </div>
  </div>
);

const AuditLogs = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = readStoredUser();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("All");
  const [resultStatus, setResultStatus] = useState("All");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState(false);
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadLogs = useCallback(async (signal) => {
    setLoading(true);
    setRequestError(false);
    setAccessRestricted(false);
    try {
      const response = await api.get("/audit-logs/logs", { signal, headers: { Authorization: `Bearer ${token}` } });
      if (response.data?.success === false) throw new Error("Request failed");
      setLogs(getList(response.data?.logs ?? response.data?.data ?? response.data));
      setPage(1);
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
      } else if (error.response?.status === 403) setAccessRestricted(true);
      else setRequestError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    // The initial request synchronizes this page with the backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs(controller.signal);
    return () => controller.abort();
  }, [loadLogs, token]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const userName = getUserName(log.user);
      const matchesSearch = !query || [userName, log.action, log.resource, log.endpoint].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesAction = action === "All" || String(log.action || "").toLowerCase() === action;
      const successful = getStatus(log.statusCode);
      const matchesStatus = resultStatus === "All" || (resultStatus === "Success" ? successful : !successful);
      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [action, logs, resultStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / Number(pageSize)));
  const visibleLogs = filteredLogs.slice((page - 1) * Number(pageSize), page * Number(pageSize));
  const successfulEvents = logs.filter((log) => getStatus(log.statusCode)).length;
  const failedEvents = logs.length - successfulEvents;

  useEffect(() => {
    // Keep pagination within bounds after filters reduce the result set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/", { replace: true }); };
  if (!token) return <Navigate to="/" replace />;
  const shell = (content) => <div className="min-h-screen bg-slate-50 text-slate-900"><Sidebar isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} onLogout={logout} /><div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}><Topbar title="Audit Logs" user={user} onMenuClick={() => setSidebarOpen(true)} />{content}</div></div>;

  if (accessRestricted) return shell(<main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-10"><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><ShieldAlert size={23} /></div><h2 className="mt-5 text-xl font-semibold text-slate-900">Access restricted</h2><p className="mt-2 text-sm leading-6 text-slate-500">You don&apos;t have permission to view audit logs.</p><button type="button" onClick={() => navigate("/dashboard")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><ArrowLeft size={16} /> Back to Dashboard</button></div></main>);

  return shell(<main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10"><section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-medium text-blue-700">Security workspace</p><h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Audit Logs</h2><p className="mt-2 text-sm text-slate-500">Review security and activity events across your employee portal.</p></div><button type="button" onClick={() => loadLogs()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button></section>
    <section className="grid gap-4 py-7 md:grid-cols-3"><StatCard label="Total Events" value={loading ? "-" : logs.length} supportingText="Recorded activity events" icon={FileClock} accent="bg-blue-50 text-blue-700" /><StatCard label="Successful Events" value={loading ? "-" : successfulEvents} supportingText="Requests with 2xx status" icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" /><StatCard label="Failed Events" value={loading ? "-" : failedEvents} supportingText="Requests with 4xx or 5xx status" icon={ShieldAlert} accent="bg-amber-50 text-amber-700" /></section>
    <section className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"><label className="relative w-full lg:max-w-sm"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search audit logs..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label><div className="flex flex-wrap items-center gap-3"><select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option>All</option><option value="view">view</option><option value="create">create</option><option value="edit">edit</option><option value="delete">delete</option></select><select value={resultStatus} onChange={(event) => { setResultStatus(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option>All</option><option>Success</option><option>Failed</option></select><select value={pageSize} onChange={(event) => { setPageSize(event.target.value); setPage(1); }} aria-label="Rows per page" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option value="10">10 / page</option><option value="25">25 / page</option><option value="50">50 / page</option></select></div></section>
    {loading ? <LogSkeleton /> : requestError ? <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">Unable to load audit logs</h3><p className="mt-1 text-sm text-slate-500">Please try again.</p><button type="button" onClick={() => loadLogs()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><RefreshCw size={15} /> Retry</button></div> : visibleLogs.length ? <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-[980px] w-full text-left"><thead><tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-3">User</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date &amp; Time</th><th className="px-5 py-3">Details</th><th className="px-5 py-3"> </th></tr></thead><tbody>{visibleLogs.map((log, index) => { const successful = getStatus(log.statusCode); const normalizedAction = String(log.action || "view").toLowerCase(); return <tr key={log._id || `${log.createdAt}-${index}`} className="border-b border-slate-100 text-sm transition-colors hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-800">{getUserName(log.user)}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${actionClass[normalizedAction] || "bg-slate-100 text-slate-600"}`}>{normalizedAction}</span></td><td className="px-5 py-4 text-slate-500">{log.resource || "N/A"}</td><td className="px-5 py-4 text-slate-500">{log.method || "N/A"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${successful ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{log.statusCode || "N/A"}</span></td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(log.createdAt)}</td><td className="max-w-xs truncate px-5 py-4 text-slate-500">{log.details || "N/A"}</td><td className="px-5 py-4"><button type="button" aria-label="View audit log" onClick={() => setSelectedLog(log)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"><Eye size={15} /> View</button></td></tr>; })}</tbody></table><div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>{filteredLogs.length ? `${(page - 1) * Number(pageSize) + 1}-${Math.min(page * Number(pageSize), filteredLogs.length)} of ${filteredLogs.length}` : "0 results"}</span><div className="flex items-center gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={14} /> Previous</button><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next <ChevronRight size={14} /></button></div></div></div> : <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><FileClock size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">No audit activity found</h3><p className="mt-1 text-sm text-slate-500">There are no events matching your current filters.</p></div>}
    {selectedLog && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && setSelectedLog(null)}><section role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" className="my-4 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 id="audit-detail-title" className="text-lg font-semibold text-slate-900">Audit event</h2><p className="mt-1 text-sm text-slate-500">Recorded request details</p></div><button type="button" aria-label="Close audit details" onClick={() => setSelectedLog(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><dl className="grid gap-x-6 gap-y-5 px-5 py-6 sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">User</dt><dd className="mt-1 text-sm text-slate-700">{getUserName(selectedLog.user)}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Action</dt><dd className="mt-1 text-sm text-slate-700">{selectedLog.action || "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Resource</dt><dd className="mt-1 text-sm text-slate-700">{selectedLog.resource || "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Method</dt><dd className="mt-1 text-sm text-slate-700">{selectedLog.method || "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Status Code</dt><dd className="mt-1 text-sm text-slate-700">{selectedLog.statusCode || "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Timestamp</dt><dd className="mt-1 text-sm text-slate-700">{formatDate(selectedLog.createdAt)}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Endpoint</dt><dd className="mt-1 break-all text-sm text-slate-700">{selectedLog.endpoint || "N/A"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">IP Address</dt><dd className="mt-1 text-sm text-slate-700">{selectedLog.ipAddress || "N/A"}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">User Agent</dt><dd className="mt-1 break-words text-sm text-slate-700">{selectedLog.userAgent || "N/A"}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">Details</dt><dd className="mt-1 break-words text-sm text-slate-700">{selectedLog.details || "N/A"}</dd></div></dl></section></div>}
  </main>);
};

export default AuditLogs;
