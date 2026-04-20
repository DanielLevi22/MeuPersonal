"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, useAuthStore } from "@/modules/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, abilities, services, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    const { signOut } = useAuthStore.getState();
    await signOut();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const canManageWorkouts = abilities?.can("manage", "Workout");
  const canManageDiet = abilities?.can("manage", "Diet");

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    ...(canManageWorkouts
      ? [
          {
            href: "/dashboard/students",
            label: "Alunos",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ),
          },
          {
            href: "/dashboard/workouts",
            label: "Treinos",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            ),
          },
        ]
      : []),
    ...(canManageDiet
      ? [
          {
            href: "/dashboard/nutrition",
            label: "Nutrição",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            ),
          },
          {
            href: "/dashboard/diets",
            label: "Dietas",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-400 font-sans selection:bg-primary/30 selection:text-white">
      {/* Visual background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -ml-64 -mt-64" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -mr-64 -mb-64" />
      </div>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 z-50 p-6">
        <div className="h-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] flex flex-col shadow-2xl shadow-black/50 overflow-hidden">
          {/* Brand */}
          <div className="p-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                Eleva<span className="text-primary"> Pro</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] pl-0.5">
                Dashboard
              </p>
            </div>

            {/* Services Context */}
            <div className="mt-8 flex flex-wrap gap-1.5">
              {services.map((service) => (
                <span
                  key={service}
                  className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest"
                >
                  {service === "nutrition"
                    ? "🍎 Nutri"
                    : service === "personal_training"
                      ? "⚡ PT"
                      : service}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_20px_rgba(204,255,0,0.05)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div
                    className={`z-10 transition-transform duration-300 ${isActive ? "scale-110 text-primary" : "group-hover:scale-110 opacity-60 group-hover:opacity-100 group-hover:text-white"}`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`text-sm font-bold uppercase tracking-widest z-10 transition-colors duration-300 ${isActive ? "text-white italic" : "text-zinc-500 group-hover:text-zinc-300"}`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-6 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#ccff00]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-6 mt-auto">
            <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center font-bold text-zinc-400 overflow-hidden">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[100px] italic">
                    {user.email?.split("@")[0]}
                  </span>
                  <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                    PRO Active
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-72 min-h-screen relative z-10">
        <main className="max-w-[1500px] mx-auto min-h-screen p-8 lg:p-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">{children}</div>
        </main>
      </div>
    </div>
  );
}
