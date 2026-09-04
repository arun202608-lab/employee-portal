import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";
import EmptyState from "../components/EmptyState";
import EmployeeSkeleton from "../components/EmployeeSkeleton";
import EmployeeTable from "../components/EmployeeTable";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const getPermissionNames = (user) => {
  const permissions = [
    ...(Array.isArray(user?.permissions) ? user.permissions : []),
    ...(Array.isArray(user?.roles)
      ? user.roles.flatMap((role) => role?.permissions || [])
      : []),
  ];

  return permissions
    .map((permission) =>
      typeof permission === "string" ? permission : permission?.name,
    )
    .filter(Boolean);
};

const normalizeKey = (key) =>
  String(key).toLowerCase().replace(/[^a-z0-9]/g, "");

const unwrapValue = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text || undefined;
  }
  if (Array.isArray(value)) {
    return value.map(unwrapValue).find(Boolean);
  }
  if (value && typeof value === "object") {
    for (const key of ["value", "displayValue", "display_value", "label", "text"]) {
      const unwrapped = unwrapValue(value[key]);
      if (unwrapped) return unwrapped;
    }

    const firstName = unwrapValue(
      value.firstName || value.first_name || value["First Name"],
    );
    const lastName = unwrapValue(
      value.lastName || value.last_name || value["Last Name"],
    );
    if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(" ");

    const nestedName = unwrapValue(value.name || value.fullName || value.full_name);
    if (nestedName) return nestedName;
  }
  return undefined;
};

const getNestedField = (record, names) => {
  const wantedKeys = new Set(names.map(normalizeKey));
  const visited = new Set();

  const search = (value) => {
    if (!value || typeof value !== "object" || visited.has(value)) return undefined;
    visited.add(value);

    for (const [key, fieldValue] of Object.entries(value)) {
      if (wantedKeys.has(normalizeKey(key))) {
        const result = unwrapValue(fieldValue);
        if (result) return result;
      }
    }

    const descriptorName = value.fieldName || value.field_name || value.key;
    if (descriptorName && wantedKeys.has(normalizeKey(descriptorName))) {
      const result = unwrapValue(
        value.value ?? value.displayValue ?? value.display_value,
      );
      if (result) return result;
    }

    for (const child of Object.values(value)) {
      const result = search(child);
      if (result) return result;
    }
    return undefined;
  };

  return search(record) || "N/A";
};

const getEmployeeName = (record) => {
  const fullName = getNestedField(record, [
    "ownerName",
    "Employee Name",
    "employee_name",
    "employeeName",
    "full_name",
    "fullName",
    "display_name",
    "displayName",
    "name",
  ]);
  if (fullName !== "N/A") return fullName;

  const firstName = getNestedField(record, [
    "First Name",
    "first_name",
    "firstName",
  ]);
  const lastName = getNestedField(record, [
    "Last Name",
    "last_name",
    "lastName",
  ]);
  const combinedName = [firstName, lastName]
    .filter((name) => name !== "N/A")
    .join(" ")
    .trim();

  return combinedName || "N/A";
};

const normalizeStatus = (value) => {
  if (typeof value === "boolean") return value ? "Active" : "Inactive";
  const status = String(value).trim().toLowerCase();
  if (["active", "enabled", "working", "true"].includes(status)) return "Active";
  if (["inactive", "disabled", "terminated", "false"].includes(status)) return "Inactive";
  return value === "N/A" ? "N/A" : String(value);
};

const normalizeEmployee = (record, index) => ({
  id: getNestedField(record, ["id", "employee_id", "Employee ID"]) === "N/A"
    ? `employee-${index}`
    : String(getNestedField(record, ["id", "employee_id", "Employee ID"])),
  name: getEmployeeName(record),
  email: String(getNestedField(record, ["Email address", "Email", "email", "work_email"])),
  employeeId: String(getNestedField(record, ["Employee ID", "employee_id", "employeeId", "id"])),
  department: String(getNestedField(record, ["Department", "department", "department_name"])),
  designation: String(getNestedField(record, ["Designation", "designation", "job_title", "title"])),
  status: normalizeStatus(
    getNestedField(record, ["Employee Status", "employee_status", "status", "isActive"]),
  ),
});

const extractRecords = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["records", "employees", "data", "result", "response"]) {
    if (payload[key] !== undefined) {
      const records = extractRecords(payload[key]);
      if (records.length) return records;
    }
  }
  return Object.values(payload).every((value) => value && typeof value === "object")
    ? Object.values(payload)
    : [];
};

const Employees = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = readStoredUser();
  const permissionNames = getPermissionNames(user);
  const hasStoredPermissions = permissionNames.length > 0;
  const hasPeopleAccess =
    !hasStoredPermissions || permissionNames.includes("zoho.people.view");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchEmployees = useCallback(async (signal) => {
    setLoading(true);
    setRequestError(false);
    try {
      const response = await api.get("/zoho/people", {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data?.success) throw new Error("Request failed");
      setEmployees(
        extractRecords(response.data.data).map((record, index) =>
          normalizeEmployee(record, index),
        ),
      );
    } catch (error) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        setRequestError(true);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hasPeopleAccess) return undefined;
    const controller = new AbortController();
    // The initial request synchronizes this page with the external API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees(controller.signal);
    return () => controller.abort();
  }, [fetchEmployees, hasPeopleAccess]);

  const departments = useMemo(
    () => ["All", ...new Set(employees.map((employee) => employee.department).filter((value) => value !== "N/A"))],
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !query || [
        employee.name,
        employee.employeeId,
        employee.email,
        employee.designation,
        employee.department,
      ].some((value) => value.toLowerCase().includes(query));
      return (
        matchesSearch &&
        (department === "All" || employee.department === department) &&
        (status === "All" || employee.status === status)
      );
    });
  }, [employees, search, department, status]);

  const activeEmployees = employees.filter(
    (employee) => employee.status.toLowerCase() === "active",
  ).length;

  if (!token) return <Navigate to="/" replace />;

  if (!hasPeopleAccess) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onClose={() => setIsSidebarOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/", { replace: true });
          }}
        />
        <div className="min-h-screen lg:pl-64">
          <Topbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-10 sm:px-8">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <ShieldAlert size={23} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-900">Access restricted</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">You don&apos;t have permission to view employee information.</p>
              <button type="button" onClick={() => navigate("/dashboard")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
        }}
      />
      <div className={`min-h-screen transition-[padding] duration-200 ${isSidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <Topbar user={user} title="Employees" onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
          <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-700">People workspace</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Employees</h2>
              <p className="mt-2 text-sm text-slate-500">Manage and view employee information from Zoho People.</p>
            </div>
            <button type="button" onClick={() => fetchEmployees()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </section>

          <section className="grid gap-4 py-7 md:grid-cols-3">
            <StatCard label="Total Employees" value={loading ? "-" : employees.length} supportingText="From Zoho People" icon={Users} accent="bg-blue-50 text-blue-700" />
            <StatCard label="Active Employees" value={loading ? "-" : activeEmployees} supportingText="Currently active" icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" />
            <StatCard label="Departments" value={loading ? "-" : Math.max(departments.length - 1, 0)} supportingText="Across the workspace" icon={Building2} accent="bg-amber-50 text-amber-700" />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Employee directory</h2>
                <p className="mt-1 text-sm text-slate-500">Live information from your connected HR workspace.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative min-w-64">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                </label>
                <select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
                  {departments.map((value) => <option key={value}>{value}</option>)}
                </select>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
                  <option>All</option><option>Active</option><option>Inactive</option>
                </select>
              </div>
            </div>
            {loading ? <EmployeeSkeleton /> : requestError ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert size={22} /></div>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">Unable to load employees</h3>
                <p className="mt-1 text-sm text-slate-500">Unable to retrieve employee information right now.</p>
                <button type="button" onClick={() => fetchEmployees()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><RefreshCw size={15} /> Retry</button>
              </div>
            ) : filteredEmployees.length ? <EmployeeTable employees={filteredEmployees} onView={setSelectedEmployee} /> : <EmptyState />}
          </section>
        </main>
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-5" onMouseDown={(event) => event.target === event.currentTarget && setSelectedEmployee(null)}>
          <section role="dialog" aria-modal="true" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">{selectedEmployee.name.slice(0, 2).toUpperCase()}</span><div><h2 className="font-semibold text-slate-900">{selectedEmployee.name}</h2><p className="mt-1 text-sm text-slate-500">Employee details</p></div></div>
              <button type="button" aria-label="Close employee details" onClick={() => setSelectedEmployee(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
            <dl className="grid gap-5 py-6 sm:grid-cols-2">
              {[[Mail, "Email", selectedEmployee.email], [UserRound, "Employee ID", selectedEmployee.employeeId], [Building2, "Department", selectedEmployee.department], [CalendarDays, "Designation", selectedEmployee.designation]].map(([Icon, label, value]) => <div key={label} className="flex gap-3"><Icon size={18} className="mt-0.5 text-slate-400" /><div><dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{label}</dt><dd className="mt-1 text-sm text-slate-700">{value}</dd></div></div>)}
            </dl>
            <div className="flex items-center gap-2 border-t border-slate-100 pt-5 text-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Status: <span className="font-medium text-slate-800">{selectedEmployee.status}</span></div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Employees;
