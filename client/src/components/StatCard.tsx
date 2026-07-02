export function StatCard({ label, value,className }: { label: string; value: string, className?: string }) {
  return (
    <div className={`rounded-2xl w-[15em] md:w-[15em] border border-white/10 bg-slate-950/60 p-4 ${className}`}>
      <p className={"text-sm" + className?"text-white font-semibold":"text-slate-400"}>{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}