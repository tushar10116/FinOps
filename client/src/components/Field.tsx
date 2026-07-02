import { ReactNode } from "react";

export default function Field({ children,className }: { children: ReactNode,className?:string }) {
  return <div className={className||""}>{children}</div>;
}