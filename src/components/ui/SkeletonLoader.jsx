/**
 * SkeletonLoader.jsx
 * Reusable shimmer skeleton loader components for all admin pages.
 * Import what you need: Skeleton, TableSkeleton, CardSkeleton, DashboardSkeleton, etc.
 */


/* ─────────────── INLINE SHIMMER CSS (injected once) ─────────────── */
if (typeof document !== 'undefined' && !document.getElementById('skeleton-shimmer-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-shimmer-style';
  style.textContent = `
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-shimmer {
      background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
      background-size: 200% 100%;
      animation: shimmer 1.6s ease-in-out infinite;
      border-radius: 6px;
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────── BASE SHIMMER ELEMENT ─────────────── */
export function Skeleton({ className = '', rounded = 'rounded-lg', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={style}
    />
  );
}

/* ─────────────── METRIC CARD SKELETON ─────────────── */
export function MetricCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-10" rounded="rounded-xl" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

/* ─────────────── TABLE ROW SKELETON ─────────────── */
export function TableRowSkeleton({ cols = 6, rows = 8 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-slate-700/30">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ─────────────── TABLE SKELETON (full table with header+filters+pagination) ─────────────── */
export function TableSkeleton({ cols = 6, rows = 8 }) {
  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/40 flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" rounded="rounded-xl" />
          <Skeleton className="h-9 w-32" rounded="rounded-xl" />
        </div>
      </div>
      <div className="px-6 py-3 border-b border-slate-700/30 flex gap-3 flex-wrap">
        <Skeleton className="h-9 w-64" rounded="rounded-xl" />
        <Skeleton className="h-9 w-36" rounded="rounded-xl" />
        <Skeleton className="h-9 w-36" rounded="rounded-xl" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/40">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowSkeleton cols={cols} rows={rows} />
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-slate-700/30 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-8" rounded="rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── CARD LIST SKELETON ─────────────── */
export function CardListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12" rounded="rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" rounded="rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── DASHBOARD FULL SKELETON ─────────────── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/40">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-32" rounded="rounded-xl" />
        </div>
      </div>
      <MetricCardSkeleton count={8} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/40">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-56 w-full" rounded="rounded-xl" />
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/40">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 rounded-full flex-1" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/40">
          <Skeleton className="h-5 w-40" />
        </div>
        <table className="w-full">
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-slate-700/20">
                <td className="px-4 py-3"><Skeleton className="h-10 w-10" rounded="rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-20" rounded="rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────── CALLING QUEUE SKELETON ─────────────── */
export function CallingQueueSkeleton() {
  return (
    <div className="space-y-4">
      <MetricCardSkeleton count={4} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TableSkeleton cols={7} rows={6} />
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40 space-y-4">
          <Skeleton className="h-5 w-32 mb-2" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 items-center p-3 bg-slate-700/30 rounded-xl">
              <Skeleton className="h-9 w-9" rounded="rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-12" rounded="rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── PROFILE PAGE SKELETON ─────────────── */
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-800/60 rounded-2xl p-8 border border-slate-700/40 flex items-center gap-6">
        <Skeleton className="h-24 w-24" rounded="rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-20" rounded="rounded-full" />
        </div>
        <Skeleton className="h-10 w-28" rounded="rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── FORM SKELETON ─────────────── */
export function FormSkeleton({ fields = 8 }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/40">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" rounded="rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Skeleton className="h-10 w-24" rounded="rounded-xl" />
          <Skeleton className="h-10 w-32" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────── BILLING SKELETON ─────────────── */
export function BillingSkeleton() {
  return (
    <div className="space-y-5">
      <MetricCardSkeleton count={4} />
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/40 flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-52" rounded="rounded-xl" />
            <Skeleton className="h-9 w-32" rounded="rounded-xl" />
            <Skeleton className="h-9 w-32" rounded="rounded-xl" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/40">
                {[1,2,3,4,5,6,7,8].map((_, i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableRowSkeleton cols={8} rows={7} />
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-700/30 flex justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-8" rounded="rounded-lg" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
