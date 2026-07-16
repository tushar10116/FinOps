import { ShieldCheck } from "lucide-react";
import { TextField } from "../components/TextField";
import { useNavigate, useSearchParams } from "react-router-dom";
import { use, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { forgetPassword, getResetToken } from "../lib/auth";

export default function ForgetPasswordPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: forgetPassword,
    onSuccess: (session) => {
      navigate("/login", { replace: true });
    }
  });

  const getTokenMutation = useMutation({
    mutationFn: getResetToken,
    onSuccess: (data) => {
        nextStep();
    }
  });

  function handleEmailSubmit(): void {
    getTokenMutation.mutate(email);
  }

  function handlePasswordReset(){
    mutation.mutate({email,token, password});
  }

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };
  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.94),rgba(14,23,41,0.92))] p-6 shadow-glow">
          <div className="absolute inset-0 bg-radial-grid bg-[size:20px_20px] opacity-30" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-6 w-6" />
                <h1 className="text-2xl font-semibold tracking-tight">
                  Forget Password
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className={step >= 1 ? "text-indigo-600 font-bold" : ""}>
                  Enter Email
                </span>
                <span className={step >= 2 ? "text-indigo-600 font-bold" : ""}>
                  Enter Password
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>
            </div>

           {(step === 1) && <form className="space-y-4" onSubmit={handleEmailSubmit}>
              <TextField
                label="Email"
                type="email"
                onChange={setEmail}
                value={email || ""}
                placeholder="you@company.com"
              />

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={mutation.isPending}
              >
                Get Reset Token
              </button>
            </form>}
            {(step === 2) && <form className="space-y-4" onSubmit={handlePasswordReset}>
                <TextField
                label="Email"
                type="email"
                disabled
                onChange={()=>{}}
                value={email || ""}
                placeholder="you@company.com"
              />

              <TextField
                label="Token"
                type="text"
                onChange={setToken}
                value={token}
                placeholder=""
              />
              <TextField
                label="Password"
                type="password"
                onChange={setPassword}
                value={password}
                placeholder="**********"
              />
              <TextField
                label="Confirm Password"
                type="password"
                onChange={setConfirmPassword}
                value={confirmPassword}
                placeholder="**********"
              />
              {mutation.isError && (
                <div className="text-red-500">{mutation.error.message}</div>
              )}
              {mutation.isSuccess && (
                <div className="text-green-500">Password reset successfully</div>
              )}
              {
               (password !== "" && confirmPassword !== "")&& (password !== confirmPassword) && <div className="text-red-500">Password does not match</div>
              }

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={mutation.isPending}
              >
                Reset Password
              </button>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => prevStep()}>Previous Step</button>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => navigate("/login", { replace: true })}>Cancel</button>
            </form>}
          </div>
        </section>
      </div>
    </main>
  );
}
