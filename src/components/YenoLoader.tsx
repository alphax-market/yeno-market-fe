import YenoLoad from "@/assets/svg/loader-svg.svg?react";

export function YenoLoader({ className }: { className?: string }) {
  return (
    <div
      className={`flex min-h-[280px] flex-col items-center justify-center  rounded-xl ${className ?? ""}`}
      aria-label="Loading"
      role="status"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* Rotating arcs */}
        <svg
          className="absolute inset-0 h-full w-full animate-yeno-loader-spin text-success"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden
        >
          {/* Left arc: ~120° segment */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="42 100"
            strokeDashoffset="0"
            transform="rotate(-70 24 24)"
          />
          {/* Right arc: ~120° segment, offset */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="42 100"
            strokeDashoffset="62"
            transform="rotate(110 24 24)"
          />
        </svg>

        {/* Central Yeno mark (static) */}
        <YenoLoad />
      </div>
    </div>
  );
}
