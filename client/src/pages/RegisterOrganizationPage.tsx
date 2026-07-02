import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CircleCheckBig } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getStoredToken, registerOrganization, saveStoredToken } from "../lib/auth";
import Divider from "../components/Divider";
import { registerOrganizationSchema } from "../form-validation/OrganizationValidation";
import { TextField } from "../components/TextField";

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const token = getStoredToken();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganization] = useState("");
  const [domain, setDomain] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isFormValid = registerOrganizationSchema.safeParse({name, email, password, confirmPassword, organizationName, domain}).success;

 console.log("Form validation result:", registerOrganizationSchema.safeParse({name, email, password, confirmPassword, organizationName, domain})); 
  const mutation = useMutation({
    mutationFn: registerOrganization,
    onSuccess: (session) => {
     
      navigate("/login", { replace: true });
    }
  });

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    mutation.mutate({ name, email, password, organizationName, domain });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Create account</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Register for FinOps</h1>
              <p className="mt-2 text-sm text-slate-400">Start with a workspace account and move into the protected dashboard.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
               
              <Divider text={"Organization Details"} />
                
              <TextField label="Organization name" value={organizationName} onChange={setOrganization} placeholder="Your Organization" />
              <TextField label="Domain" type="text" value={domain} onChange={setDomain} placeholder="yourcompany.com" />
             
             <Divider text={"Admin User Details"} />
              <TextField label="Full name" value={name} onChange={setName} placeholder="Avery Morgan" />
              <TextField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
              <TextField label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
            <TextField label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" />
              {mutation.isError ? (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {mutation.error instanceof Error ? mutation.error.message : "Registration failed"}
                </p>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isFormValid || mutation.isPending}
              >
                {mutation.isPending ? "Creating account..." : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              Already have an account? <Link className="text-cyan-300 hover:text-cyan-200" to="/login">Sign in</Link>
            </p>
            <p className="mt-6 text-sm text-slate-400">
              Organization not registered? <Link className="text-cyan-300 hover:text-cyan-200" to="/register-organization">Register organization</Link>
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.94),rgba(14,23,41,0.92))] p-6 shadow-glow">
          <div className="absolute inset-0 bg-radial-grid bg-[size:20px_20px] opacity-30" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-emerald-200">
                <CircleCheckBig className="h-3.5 w-3.5" />
                Register flow enabled
              </span>
              <div className="space-y-3">
                <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Create an account and land directly in your protected workspace.
                </h2>
                <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  This page is designed for a fast signup flow, with a clear handoff into the dashboard once the session is created.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Authentication</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Role ready</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Protected routes</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

