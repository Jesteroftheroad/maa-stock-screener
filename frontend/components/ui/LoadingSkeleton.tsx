"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded", className)}
      style={{ background: "rgba(255,255,255,0.06)" }}
    />
  );
}

export function StockCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-6 w-8" />
      </div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <Skeleton className="h-5 w-5 rounded-md" />
      <Skeleton className="h-6 w-24 mt-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SmartMoneyCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StockCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
