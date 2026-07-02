import { ChangeEventHandler, ReactNode } from "react";

export default function SelectField({
  id,
  name,
  value,
  onChange,
  children
}: {
  id: string;
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  children: ReactNode;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
    >
      {children}
    </select>
  );
}
