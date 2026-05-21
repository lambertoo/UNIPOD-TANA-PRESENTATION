"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/visitors", label: "Visitors" },
];

export function Navigation() {
  const currentPathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-screen w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Visitor Counter
        </h1>
        <p className="text-xs text-gray-500 mt-1">AI-Powered Tracking</p>
      </div>
      <div className="space-y-1">
        {NAV_ITEMS.map((navItem) => {
          const isActive =
            navItem.href === "/"
              ? currentPathname === "/"
              : currentPathname.startsWith(navItem.href);

          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {navItem.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
