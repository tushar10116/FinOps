import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CloudCog, LayoutDashboard, LogOut, Shield, UsersRound } from "lucide-react";
import { clearStoredToken } from "../lib/auth";
import { useUser } from "../hooks/useUser";

const navigationItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    allowedRoles:["admin","user"]
  },
  {
    to: "/organization-users",
    label: "Organization users",
    icon: UsersRound,
    allowedRoles:["admin"]
  },
  {
    to: "/cloud-platforms",
    label: "Cloud platforms",
    icon: CloudCog,
    allowedRoles:["admin"]
  }
] ;

export default function WorkspaceLayout() {
  const navigate = useNavigate();
 const { data:loadedUser, isLoading, isError } = useUser(); 
  const handleSignOut = () => {
    clearStoredToken();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-6">
        <aside className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div>
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">FinOps Workspace</p>
                <h1 className="mt-1 text-lg font-semibold text-white">Cloud management</h1>
              </div>
            </div>

            {!isLoading && loadedUser && <nav className="mt-5 space-y-2">
              {navigationItems.filter((item) => item.allowedRoles.includes(loadedUser.role)).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                      isActive
                        ? "bg-cyan-400 text-slate-950"
                        : "border border-transparent bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                    ].join(" ")
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>}
          </div>

         {loadedUser && loadedUser.role === "admin" && <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workspace note</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use the menu to add organization members, register cloud platforms, and route into the dashboard.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>}
           {loadedUser && loadedUser.role === "user" && <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
            
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>}
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 shadow-glow backdrop-blur-xl lg:hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Navigation</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
          <Outlet />
        </section>
      </div>
    </main>
  );
}
