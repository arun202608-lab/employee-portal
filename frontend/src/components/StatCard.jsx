const StatCard = ({ label, value, supportingText, icon: Icon, accent }) => (
  <article className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
      <div className={`rounded-lg p-2.5 ${accent}`}>
        <Icon size={19} strokeWidth={1.8} />
      </div>
    </div>
    <p className="mt-4 text-xs text-slate-400">{supportingText}</p>
  </article>
);

export default StatCard;
