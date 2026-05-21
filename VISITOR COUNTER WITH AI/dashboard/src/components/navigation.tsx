"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  ScanEye,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/visitors", label: "Visitors", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const currentPathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border-subtle flex flex-col z-50">
      <div className="px-5 py-6 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <ScanEye className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight leading-tight">
              Visitor Counter
            </h1>
            <p className="text-[11px] text-text-muted leading-tight">
              AI-Powered Tracking
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-1">
        <p className="px-3 pt-4 pb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          Overview
        </p>
        {NAV_ITEMS.map((navItem) => {
          const isActive =
            navItem.href === "/"
              ? currentPathname === "/"
              : currentPathname.startsWith(navItem.href);
          const Icon = navItem.icon;

          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-accent-blue/10 text-accent-blue"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? "text-accent-blue" : "text-text-muted group-hover:text-text-secondary"
                }`}
              />
              {navItem.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-elevated/30 border border-border-subtle">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green"></span>
          </span>
          <span className="text-xs text-text-secondary font-medium">
            System Active
          </span>
        </div>
      </div>
    </nav>
  );
}
