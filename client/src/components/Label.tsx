import { ReactNode } from "react";

export default function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2  block text-sm font-medium text-slate-200">
      {children}
    </label>
  );
}