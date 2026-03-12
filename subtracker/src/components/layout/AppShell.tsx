"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subcontractors", label: "Subcontractors", icon: Users },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <nav
        className="flex shrink-0 border-b border-slate-200 bg-white md:w-56 md:flex-col md:border-b-0 md:border-r"
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center px-4 md:h-16">
          <Link href="/" className="text-lg font-bold text-slate-900">
            SubTracker
          </Link>
        </div>
        <ul className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3 md:pb-0">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
