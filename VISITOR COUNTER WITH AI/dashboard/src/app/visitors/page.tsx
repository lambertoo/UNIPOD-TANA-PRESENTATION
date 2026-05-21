"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchVisitors } from "@/lib/api";
import { getVisitorPhotoUrl } from "@/lib/api";
import type { Visitor } from "@/lib/api";
import { SkeletonRow } from "@/components/skeleton-card";
import {
  Search,
  Users,
  ChevronRight,
  User,
} from "lucide-react";

const POLL_INTERVAL_MS = 10000;

function formatDateTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ isInside }: { isInside: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
        isInside
          ? "bg-accent-green/10 text-accent-green border-accent-green/20"
          : "bg-surface-elevated/50 text-text-muted border-border-subtle"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isInside ? "bg-accent-green" : "bg-text-muted"}`} />
      {isInside ? "Inside" : "Outside"}
    </span>
  );
}

function GenderBadge({ gender }: { gender: string }) {
  const isMale = gender.toLowerCase() === "male";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${
        isMale
          ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
          : "bg-accent-pink/10 text-accent-pink border-accent-pink/20"
      }`}
    >
      <User className="w-3 h-3" />
      {gender}
    </span>
  );
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const refreshVisitorsList = useCallback(async () => {
    try {
      const fetchedVisitors = await fetchVisitors();
      setVisitors(fetchedVisitors);
    } catch {
      // API not available yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVisitorsList();
    const pollTimer = setInterval(refreshVisitorsList, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer);
  }, [refreshVisitorsList]);

  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return visitors;
    const q = searchQuery.toLowerCase();
    return visitors.filter(
      (v) =>
        v.id.toString().includes(q) ||
        v.gender.toLowerCase().includes(q)
    );
  }, [visitors, searchQuery]);

  const insideCount = visitors.filter((v) => v.is_inside).length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Visitors
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface border border-border-subtle text-xs font-medium text-text-secondary">
              {visitors.length} total
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {insideCount} currently inside · {visitors.length - insideCount} outside
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by ID or gender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-elevated/20">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Photo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Gender
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">
                  First Seen
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">
                  Last Seen
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <SkeletonRow cols={7} />
                  <SkeletonRow cols={7} />
                  <SkeletonRow cols={7} />
                  <SkeletonRow cols={7} />
                </>
              ) : (
                filteredVisitors.map((visitor) => (
                  <tr
                    key={visitor.id}
                    onClick={() => router.push(`/visitors/${visitor.id}`)}
                    className="border-b border-border-subtle hover:bg-surface-elevated/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-surface-elevated overflow-hidden border border-border-subtle">
                        <img
                          src={getVisitorPhotoUrl(visitor.id)}
                          alt={`Visitor ${visitor.id}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-text-primary">
                      #{visitor.id}
                    </td>
                    <td className="px-4 py-3">
                      <GenderBadge gender={visitor.gender} />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary hidden md:table-cell">
                      {formatDateTime(visitor.first_seen_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary hidden lg:table-cell">
                      {formatDateTime(visitor.last_seen_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isInside={visitor.is_inside} />
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && filteredVisitors.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-text-muted" />
                      </div>
                      <p className="text-text-muted text-sm">
                        {searchQuery ? "No visitors match your search" : "No visitors recorded yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
