"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchVisitorDetail } from "@/lib/api";
import type { VisitorDetail } from "@/lib/api";

function formatDateTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function DirectionIndicator({ direction }: { direction: string }) {
  const isEntry = direction.toLowerCase() === "enter";
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isEntry ? "text-green-400" : "text-red-400"
      }`}
    >
      {isEntry ? "↓ Enter" : "↑ Exit"}
    </span>
  );
}

export default function VisitorDetailPage() {
  const params = useParams();
  const visitorId = Number(params.id);
  const [visitorDetail, setVisitorDetail] = useState<VisitorDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!visitorId) return;

    fetchVisitorDetail(visitorId)
      .then((detail) => {
        setVisitorDetail(detail);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [visitorId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading visitor details...</p>
      </div>
    );
  }

  if (!visitorDetail) {
    return (
      <div className="space-y-4">
        <Link
          href="/visitors"
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          &larr; Back to Visitors
        </Link>
        <p className="text-gray-500">Visitor not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/visitors"
        className="text-blue-400 hover:text-blue-300 text-sm inline-block"
      >
        &larr; Back to Visitors
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg flex flex-col items-center">
          <div className="w-40 h-40 rounded-xl bg-gray-700 overflow-hidden mb-4">
            {visitorDetail.photo_filename && (
              <img
                src={`/api/photos/${visitorDetail.photo_filename}`}
                alt={`Visitor ${visitorDetail.id}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-200">
            Visitor #{visitorDetail.id}
          </h2>
        </div>

        <div className="md:col-span-2 bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <span
                className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                  visitorDetail.gender.toLowerCase() === "male"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-pink-500/20 text-pink-300"
                }`}
              >
                {visitorDetail.gender} (
                {(visitorDetail.gender_confidence * 100).toFixed(1)}%)
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span
                className={`text-sm font-medium ${
                  visitorDetail.is_inside
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                {visitorDetail.is_inside ? "Currently Inside" : "Outside"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">First Seen</p>
              <p className="text-sm text-gray-200">
                {formatDateTime(visitorDetail.first_seen_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Seen</p>
              <p className="text-sm text-gray-200">
                {formatDateTime(visitorDetail.last_seen_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          Event Timeline
        </h3>
        <div className="space-y-3">
          {visitorDetail.events.length === 0 && (
            <p className="text-gray-500 text-sm">No events recorded</p>
          )}
          {visitorDetail.events.map((crossingEvent) => (
            <div
              key={crossingEvent.id}
              className="flex items-center gap-4 bg-gray-800 rounded-lg px-4 py-3"
            >
              <div className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
              <DirectionIndicator direction={crossingEvent.direction} />
              <span className="text-sm text-gray-400">
                Confidence: {(crossingEvent.confidence * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-auto">
                {formatDateTime(crossingEvent.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
