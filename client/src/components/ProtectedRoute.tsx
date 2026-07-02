import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { clearStoredToken, fetchCurrentUser, getStoredToken } from "../lib/auth";

export default function ProtectedRoute() {
  const token = getStoredToken();

  const { isLoading, isError } = useQuery({
    queryKey: ["current-user", token],
    queryFn: () => fetchCurrentUser(token as string),
    
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    clearStoredToken();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 text-center shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">FinOps Workspace</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Checking your session</h1>
        </div>
      </div>
    </main>
  );
}
