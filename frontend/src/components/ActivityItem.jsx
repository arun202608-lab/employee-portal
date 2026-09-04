const ActivityItem = ({ icon: Icon, description, time }) => (
  <li className="flex items-center gap-3 border-b border-slate-100 py-4 last:border-b-0 last:pb-0 first:pt-0">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
      <Icon size={16} strokeWidth={1.8} />
    </div>
    <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{description}</p>
    <time className="shrink-0 text-xs text-slate-400">{time}</time>
  </li>
);

export default ActivityItem;
