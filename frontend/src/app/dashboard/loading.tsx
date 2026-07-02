import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-slate-200" />
          <Skeleton className="h-4 w-64 bg-slate-200" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg bg-slate-200" />
          <Skeleton className="h-10 w-32 rounded-lg bg-slate-900/20" />
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white border border-slate-100 shadow-sm" />
        ))}
      </div>

      {/* Main Content Area Skeleton (Table/Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-[400px] w-full rounded-2xl bg-white border border-slate-100 shadow-sm" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-2xl bg-white border border-slate-100 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
