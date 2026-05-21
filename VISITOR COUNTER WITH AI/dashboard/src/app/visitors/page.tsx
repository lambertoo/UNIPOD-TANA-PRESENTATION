"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchVisitors } from "@/lib/api";
import type { Visitor } from "@/lib/api";

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
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        isInside
          ? "bg-green-500/20 text-green-300"
          : "bg-gray-500/20 text-gray-400"
      }`}
    >
      {isInside ? "Inside" : "Outside"}
    </span>
  );
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const router = useRouter();

  const refreshVisitorsList = useCallback(async () => {
    try {
      const fetchedVisitors = await fetchVisitors();
      setVisitors(fetchedVisitors);
    } catch {
      // API not available yet
    }
  }, []);

  useEffect(() => {
    refreshVisitorsList();
    const pollTimer = setInterval(refreshVisitorsList, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer);
  }, [refreshVisitorsList]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visitors</h1>

      <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                Photo
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                ID
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                Gender
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                First Seen
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                Last Seen
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor) => (
              <tr
                key={visitor.id}
                onClick={() => router.push(`/visitors/${visitor.id}`)}
                className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    {visitor.photo_filename && (
                      <img
                        src={`/api/photos/${visitor.photo_filename}`}
                        alt={`Visitor ${visitor.id}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-200">
                  #{visitor.id}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      visitor.gender.toLowerCase() === "male"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-pink-500/20 text-pink-300"
                    }`}
                  >
                    {visitor.gender}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {formatDateTime(visitor.first_seen_at)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {formatDateTime(visitor.last_seen_at)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge isInside={visitor.is_inside} />
                </td>
              </tr>
            ))}
            {visitors.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  No visitors recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
