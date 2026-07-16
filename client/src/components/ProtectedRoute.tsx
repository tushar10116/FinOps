import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { clearStoredToken, fetchCurrentUser, getStoredToken } from "../lib/auth";
import { useUser } from "../hooks/useUser";

export default function ProtectedRoute({authorisedRoles}: {authorisedRoles?: string[]}) {
  const token = getStoredToken();
  const navigate = useNavigate();

  const { data:loadedUser, isLoading, isError } = useUser();



  if(loadedUser && authorisedRoles && !authorisedRoles?.includes(loadedUser.role!)) {
    
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 5000);

    return <UnAuthorised />;
  }

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


function UnAuthorised(){
  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 text-center shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">FinOps Workspace</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">You are not authorized to access this page</h1>
      </div>
    </div>
  </main>
}