import React from 'react';
import { AgroVisionLogo } from './AgroVisionLogo';

export const AppInitialSkeleton: React.FC = () => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading AgroVision AI"
      className="min-h-screen w-full bg-[#f1f6f1] text-[#13281c] flex flex-col"
    >
      {/* Top Bar Skeleton */}
      <div className="sticky top-0 z-20 h-14 lg:h-16 bg-white/95 border-b border-[#cbdcd0] px-4 lg:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AgroVisionLogo className="w-8 h-8 lg:w-9 lg:h-9 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded-md native-shimmer" />
            <div className="h-2 w-20 rounded-md native-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl native-shimmer" />
          <div className="h-8 w-16 rounded-xl native-shimmer" />
          <div className="h-8 w-14 rounded-xl native-shimmer" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-24 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-3">
            {/* Hero Card Skeleton */}
            <div className="rounded-3xl bg-[#14532d] p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-32 rounded bg-white/15 animate-pulse" />
                  <div className="h-6 w-56 rounded-lg bg-white/20 animate-pulse" />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-14 h-12 rounded-2xl bg-white/15 animate-pulse" />
                  <div className="w-14 h-12 rounded-2xl bg-white/15 animate-pulse" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#0f3d21] p-3 space-y-2.5">
                <div className="flex justify-between">
                  <div className="h-3 w-36 rounded bg-white/15" />
                  <div className="h-3 w-16 rounded bg-white/15" />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="h-10 rounded-xl bg-white/15" />
                  <div className="h-10 rounded-xl bg-white/15" />
                  <div className="h-10 rounded-xl bg-white/15" />
                  <div className="h-10 rounded-xl bg-white/15" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-11 rounded-2xl bg-[#166534] border border-white/20" />
                <div className="h-11 rounded-2xl bg-white/90" />
              </div>
            </div>

            {/* 4 Branches Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white border border-[#cbdcd0] space-y-2 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl native-shimmer" />
                  <div className="h-3.5 w-20 rounded native-shimmer" />
                  <div className="h-2.5 w-14 rounded native-shimmer" />
                </div>
              ))}
            </div>

            {/* Recent Leaf Checks Skeleton */}
            <div className="rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-3">
              <div className="h-4 w-36 rounded native-shimmer" />
              <div className="h-16 w-full rounded-xl native-shimmer" />
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-3">
              <div className="h-4 w-40 rounded native-shimmer" />
              <div className="h-24 w-full rounded-xl native-shimmer" />
            </div>
            <div className="rounded-2xl bg-white border border-[#cbdcd0] p-4 space-y-2.5">
              <div className="h-4 w-36 rounded native-shimmer" />
              <div className="h-12 w-full rounded-xl native-shimmer" />
              <div className="h-12 w-full rounded-xl native-shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dock Skeleton */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 max-w-[440px] mx-auto h-14 rounded-full bg-white/95 border border-[#cbdcd0] px-3 flex items-center justify-between gap-2 shadow-md">
        <div className="flex-1 h-9 rounded-full native-shimmer" />
        <div className="flex-1 h-9 rounded-full native-shimmer" />
        <div className="flex-1 -mt-4 h-12 rounded-full bg-[#14532d]/90" />
        <div className="flex-1 h-9 rounded-full native-shimmer" />
        <div className="flex-1 h-9 rounded-full native-shimmer" />
      </div>
    </div>
  );
};
