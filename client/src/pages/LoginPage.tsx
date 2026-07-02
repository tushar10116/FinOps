import { useMutation } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getStoredToken, loginUser, saveStoredToken } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const token = getStoredToken();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (session) => {
      saveStoredToken(session.token);
      navigate("/dashboard", { replace: true });
    }
  });

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ email, password });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.94),rgba(14,23,41,0.92))] p-6 shadow-glow">
          <div className="absolute inset-0 bg-radial-grid bg-[size:20px_20px] opacity-30" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sign in securely
              </span>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Welcome back to your cloud cost workspace.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  Log in to see budgets, savings opportunities, and the dashboards you will customize next.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Tailwind CSS</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">React Query</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Lucide React</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Zod</span>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Authentication</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Sign in</h2>
              <p className="mt-2 text-sm text-slate-400">Use your account to access the protected dashboard.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
              <TextField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

              {mutation.isError ? (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {mutation.error instanceof Error ? mutation.error.message : "Login failed"}
                </p>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              Need an account? <Link className="text-cyan-300 hover:text-cyan-200" to="/register">Create one</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  type,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
      />
    </label>
  );
}