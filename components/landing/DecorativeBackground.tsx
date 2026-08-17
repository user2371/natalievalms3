export function DecorativeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent-soft/40 blur-3xl" />
      <div className="absolute -right-20 top-64 h-80 w-80 rounded-full bg-rose-line/30 blur-3xl" />
      <div className="absolute left-1/3 top-[120%] h-96 w-96 -translate-x-1/2 rounded-full bg-accent-soft/30 blur-3xl" />
      <svg
        className="absolute -bottom-10 -left-10 h-56 w-56 text-rose-line/50"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M10 150 Q60 80 120 110 T190 40"
          stroke="currentColor"
          strokeWidth="26"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="absolute right-8 top-1/2 h-16 w-16 text-accent/30"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    </div>
  );
}
