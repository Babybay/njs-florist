export default function GlobalLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat halaman"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-stone-200"
    >
      <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-black" />
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
