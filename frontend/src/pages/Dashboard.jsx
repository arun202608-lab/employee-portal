import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Headphones,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ActivityItem from "../components/ActivityItem";
import ServiceCard from "../components/ServiceCard";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Topbar from "../components/Topbar";

const services = [
  {
    name: "Zoho People",
    permission: "zoho.people.view",
    description: "Employee information and HR operations",
    icon: Users,
  },
  {
    name: "Zoho CRM",
    permission: "zoho.crm.view",
    description: "Customer and sales management",
    icon: BriefcaseBusiness,
  },
  {
    name: "Zoho Desk",
    permission: "zoho.desk.view",
    description: "Support tickets and customer service",
    icon: Headphones,
  },
  {
    name: "Zoho Books",
    permission: "zoho.books.view",
    description: "Finance and accounting operations",
    icon: BookOpen,
  },
];

const activities = [
  { description: "Viewed employee records", time: "12 min ago", icon: Users },
  {
    description: "Logged in to Employee Portal",
    time: "1 hour ago",
    icon: ShieldCheck,
  },
  {
    description: "Updated role permissions",
    time: "Yesterday",
    icon: Activity,
  },
  {
    description: "Created a new employee",
    time: "Yesterday",
    icon: UserPlus,
  },
];

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const user = readStoredUser();

  if (!localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  const permissionNames = getPermissionNames(user);
  const hasStoredPermissions = permissionNames.length > 0;
  const hasAccess = (permission) =>
    !hasStoredPermissions || permissionNames.includes(permission);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        onLogout={handleLogout}
      />

      <div
        className={`min-h-screen transition-[padding] duration-200 ${
          isSidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64"
        }`}
      >
        <Topbar
          user={user}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
          <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-700">Workspace overview</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Good morning, {user?.name || "there"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Here&apos;s an overview of your workspace and connected services.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays size={16} strokeWidth={1.8} />
              <span>{formattedDate}</span>
            </div>
          </section>

          <section className="grid gap-4 py-7 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Employees"
              value="24"
              supportingText="2 added this month"
              icon={Users}
              accent="bg-blue-50 text-blue-700"
            />
            <StatCard
              label="Active Users"
              value="21"
              supportingText="87.5% of all employees"
              icon={Activity}
              accent="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              label="Connected Services"
              value="4"
              supportingText="All systems operational"
              icon={BriefcaseBusiness}
              accent="bg-amber-50 text-amber-700"
            />
            <StatCard
              label="Recent Activities"
              value="12"
              supportingText="Across your workspace"
              icon={ShieldCheck}
              accent="bg-slate-100 text-slate-700"
            />
          </section>

          <section className="py-1">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Connected Services
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Access the business tools available to your role.
                </p>
              </div>
              <span className="hidden text-xs font-medium text-slate-400 sm:block">
                {services.filter((service) => hasAccess(service.permission)).length} connected
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.name}
                  {...service}
                  hasAccess={hasAccess(service.permission)}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-6 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent Activity
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The latest changes across your workspace.
                  </p>
                </div>
                <Activity size={19} className="text-slate-400" strokeWidth={1.8} />
              </div>
              <ul>
                {activities.map((activity) => (
                  <ActivityItem key={activity.description} {...activity} />
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Workspace status
              </p>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">
                Your workspace is ready.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Roles and permissions keep access focused across every connected
                service.
              </p>
              <div className="mt-7 flex items-center gap-2 text-sm text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                All systems operational
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
