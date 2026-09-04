import { Bell, ChevronDown, Menu } from "lucide-react";

const Topbar = ({ user, onMenuClick, title = "Dashboard" }) => {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EP";
  const roleName = Array.isArray(user?.roles)
    ? user.roles.find((role) => typeof role === "object" && role?.name)?.name
    : typeof user?.role === "object"
      ? user.role?.name
      : user?.role;

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={19} strokeWidth={1.8} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
        </button>
        <div className="h-7 w-px bg-slate-200" />
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-1 transition-colors hover:bg-slate-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-32 truncate text-sm font-medium text-slate-800">
              {user?.name || "Workspace user"}
            </span>
            <span className="block max-w-32 truncate text-xs text-slate-400">
              {roleName || "Member"}
            </span>
          </span>
          <ChevronDown size={15} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
