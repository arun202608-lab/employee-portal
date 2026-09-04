import {
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileClock,
  Headphones,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Employees", icon: Users, path: "/employees" },
  { label: "Users", icon: UserRound, path: "/users" },
  { label: "Roles", icon: ShieldCheck, path: "/roles" },
  { label: "Permissions", icon: KeyRound, path: "/permissions" },
  { label: "Audit Logs", icon: FileClock, path: "/audit-logs" },
];

const serviceItems = [
  { label: "Zoho People", icon: Users },
  { label: "Zoho CRM", icon: BriefcaseBusiness },
  { label: "Zoho Desk", icon: Headphones },
  { label: "Zoho Books", icon: BookOpen },
];

const Sidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
  <>
    {isOpen && (
      <button
        type="button"
        aria-label="Close navigation"
        className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        onClick={onClose}
      />
    )}

    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } ${isCollapsed ? "lg:w-[76px]" : ""}`}
    >
      <div className="flex h-20 items-center border-b border-slate-100 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            EP
          </div>
          {!isCollapsed && (
            <span className="truncate text-sm font-semibold text-slate-900">
              Employee Portal
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Close navigation"
          className="ml-auto rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        {!isCollapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>
        )}
        <div className="space-y-1">
          {navigationItems.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
            <button
              key={label}
              type="button"
              title={isCollapsed ? label : undefined}
              onClick={() => {
                if (path) navigate(path);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {!isCollapsed && <span>{label}</span>}
            </button>
            );
          })}
        </div>

        <div className="my-7 border-t border-slate-100" />

        {!isCollapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Connected Services
          </p>
        )}
        <div className="space-y-1">
          {serviceItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              title={isCollapsed ? label : undefined}
              onClick={() => label === "Zoho People" && navigate("/employees")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {!isCollapsed && <span>{label}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          title={isCollapsed ? "Settings" : undefined}
          className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Settings size={18} strokeWidth={1.8} />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button
          type="button"
          title={isCollapsed ? "Logout" : undefined}
          onClick={onLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} strokeWidth={1.8} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        type="button"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapse}
        className="absolute -right-3 top-[72px] hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 lg:flex"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  </>
  );
};

export { Menu };
export default Sidebar;
