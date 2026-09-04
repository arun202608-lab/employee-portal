import { ArrowUpRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ServiceCard = ({ name, description, icon: Icon, hasAccess = true }) => {
  const navigate = useNavigate();
  if (!hasAccess) return null;

  return (
    <article className="group flex min-h-48 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50">
            <Check size={11} strokeWidth={2.5} />
          </span>
          Connected
        </span>
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
        <p className="mt-1.5 max-w-56 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => name === "Zoho People" && navigate("/employees")}
        className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-blue-700 transition-colors hover:text-blue-900"
      >
        Open service
        <ArrowUpRight size={15} strokeWidth={2} />
      </button>
    </article>
  );
};

export default ServiceCard;
