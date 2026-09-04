import { Eye, Mail } from "lucide-react";

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const EmployeeTable = ({ employees, onView }) => (
  <div className="overflow-x-auto">
    <table className="min-w-[760px] w-full text-left">
      <thead>
        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <th className="px-5 py-3 font-semibold">Employee</th>
          <th className="px-5 py-3 font-semibold">Employee ID</th>
          <th className="px-5 py-3 font-semibold">Department</th>
          <th className="px-5 py-3 font-semibold">Designation</th>
          <th className="px-5 py-3 font-semibold">Status</th>
          <th className="px-5 py-3 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee, index) => {
          const isActive = employee.status.toLowerCase() === "active";
          return (
            <tr
              key={`${employee.id}-${index}`}
              className="border-b border-slate-100 text-sm transition-colors hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                    {getInitials(employee.name === "N/A" ? "NA" : employee.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{employee.name}</p>
                    {employee.email !== "N/A" && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                        <Mail size={12} /> {employee.email}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-slate-500">{employee.employeeId}</td>
              <td className="px-5 py-4 text-slate-500">{employee.department}</td>
              <td className="px-5 py-4 text-slate-500">{employee.designation}</td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {employee.status}
                </span>
              </td>
              <td className="px-5 py-4">
                <button
                  type="button"
                  aria-label={`View ${employee.name}`}
                  onClick={() => onView(employee)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
                >
                  <Eye size={15} /> View
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default EmployeeTable;
