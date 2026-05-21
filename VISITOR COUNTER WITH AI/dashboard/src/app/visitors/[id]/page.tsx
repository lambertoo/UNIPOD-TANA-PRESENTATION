"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchVisitorDetail } from "@/lib/api";
import { getVisitorPhotoUrl } from "@/lib/api";
import type { VisitorDetail } from "@/lib/api";
import { SkeletonText } from "@/components/skeleton-card";
import {
  ArrowLeft,
  LogIn,
  LogOut,
  User,
  Clock,
  Calendar,
  Activity,
  Footprints,
} from "lucide-react";

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

function formatDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function DirectionIndicator({ direction }: { direction: string }) {
  const isEntry = direction.toLowerCase() === "enter";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium ${
        isEntry ? "text-accent-green" : "text-accent-red"
      }`}
    >
      {isEntry ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
      {isEntry ? "Entered" : "Exited"}
    </span>
  );
}

export default function VisitorDetailPage() {
  const params = useParams();
  const router = useRouter();
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
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-2 text-text-secondary">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Visitors</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle flex flex-col items-center">
            <div className="w-40 h-40 rounded-xl bg-surface-elevated animate-pulse mb-4" />
            <SkeletonText lines={1} />
          </div>
          <div className="md:col-span-2 bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
            <SkeletonText lines={4} />
          </div>
        </div>
      </div>
    );
  }

  if (!visitorDetail) {
    return (
      <div className="space-y-4 max-w-5xl">
        <button
          onClick={() => router.push("/visitors")}
          className="inline-flex items-center gap-2 text-accent-blue hover:text-accent-blue/80 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Visitors
        </button>
        <div className="bg-surface rounded-xl p-8 shadow-sm border border-border-subtle text-center">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-muted">Visitor not found</p>
        </div>
      </div>
    );
  }

  const isMale = visitorDetail.gender.toLowerCase() === "male";
  const totalVisits = visitorDetail.events.length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/visitors")}
        className="inline-flex items-center gap-2 text-accent-blue hover:text-accent-blue/80 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Visitors
      </button>

      {/* Profile + Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photo Card */}
        <div className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle flex flex-col items-center">
          <div className="w-40 h-40 rounded-xl bg-surface-elevated overflow-hidden mb-5 border border-border-subtle">
            <img
              src={getVisitorPhotoUrl(visitorDetail.id)}
              alt={`Visitor ${visitorDetail.id}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            Visitor #{visitorDetail.id}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${
                visitorDetail.is_inside
                  ? "bg-accent-green/10 text-accent-green border-accent-green/20"
                  : "bg-surface-elevated/50 text-text-muted border-border-subtle"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  visitorDetail.is_inside ? "bg-accent-green" : "bg-text-muted"
                }`}
              />
              {visitorDetail.is_inside ? "Currently Inside" : "Outside"}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="md:col-span-2 bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
          <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-text-secondary" />
            Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Gender
              </p>
              <span
                className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium border ${
                  isMale
                    ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
                    : "bg-accent-pink/10 text-accent-pink border-accent-pink/20"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {visitorDetail.gender} (
                {(visitorDetail.gender_confidence * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Total Visits
              </p>
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-primary font-medium">
                  {totalVisits} crossing{totalVisits !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                First Seen
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-primary">
                  {formatDateTime(visitorDetail.first_seen_at)}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Last Seen
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-primary">
                  {formatDateTime(visitorDetail.last_seen_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
        <h3 className="text-base font-semibold text-text-primary mb-5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-text-secondary" />
          Event Timeline
        </h3>

        {visitorDetail.events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-text-muted text-sm">No events recorded</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border-subtle" />

            <div className="space-y-4">
              {visitorDetail.events.map((crossingEvent, index) => {
                const isEntry =
                  crossingEvent.direction.toLowerCase() === "enter";
                return (
                  <div
                    key={crossingEvent.id}
                    className="relative flex items-start gap-4 pl-1 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Dot */}
                    <div
                      className={`relative z-10 mt-1.5 w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                        isEntry
                          ? "bg-accent-green border-accent-green"
                          : "bg-accent-red border-accent-red"
                      }`}
                    />

                    {/* Content */}
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 bg-surface-elevated/30 hover:bg-surface-elevated/50 rounded-lg px-4 py-3 border border-border-subtle transition-colors">
                      <DirectionIndicator
                        direction={crossingEvent.direction}
                      />
                      <span className="text-xs text-text-muted sm:ml-auto font-mono">
                        {formatDateTime(crossingEvent.timestamp)}
                      </span>
                      <span className="text-xs text-text-muted">
                        Confidence: {(crossingEvent.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
