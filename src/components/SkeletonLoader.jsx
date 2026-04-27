import React from 'react'

function Shimmer({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${className}`} />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Shimmer className="w-8 h-8 rounded-xl" />
        <Shimmer className="w-16 h-3 rounded" />
      </div>
      <Shimmer className="w-24 h-6 rounded" />
      <Shimmer className="w-20 h-2 rounded mt-2" />
    </div>
  )
}

export function SkeletonList({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
          <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="w-3/4 h-4 rounded" />
            <Shimmer className="w-1/2 h-3 rounded" />
          </div>
          <Shimmer className="w-16 h-5 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Shimmer className="w-full h-32 rounded-2xl" />
      
      <Shimmer className="w-full h-20 rounded-2xl" />
      
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

export function DataLoaderSkeleton({ type = 'dashboard', className = '' }) {
  switch (type) {
    case 'dashboard':
      return <SkeletonDashboard className={className} />
    case 'list':
      return <SkeletonList className={className} />
    case 'card':
      return <SkeletonCard className={className} />
    default:
      return <SkeletonDashboard className={className} />
  }
}

export function InitialLoader({ className = '' }) {
  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center ${className}`}>
      <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-2xl animate-spin mb-4" />
      <p className="text-sm text-slate-400 font-medium">Carregando...</p>
    </div>
  )
}