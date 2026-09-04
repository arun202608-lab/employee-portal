const EmployeeSkeleton = () => (
  <div className="space-y-3 p-5" aria-label="Loading employees">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="grid min-w-[760px] grid-cols-6 items-center gap-5 border-b border-slate-100 py-4 last:border-0">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          <span className="h-3 w-28 animate-pulse rounded bg-slate-200" />
        </div>
        <span className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        <span className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <span className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <span className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
        <span className="h-7 w-14 animate-pulse rounded-lg bg-slate-200" />
      </div>
    ))}
  </div>
);

export default EmployeeSkeleton;
