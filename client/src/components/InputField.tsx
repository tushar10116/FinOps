import { ChangeEventHandler } from "react";

export default function InputField({
  id,
  name,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  id: string;
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
    />
  );
}