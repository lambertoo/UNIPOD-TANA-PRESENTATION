"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchVisitorStats,
  fetchEvents,
  fetchHourlyTraffic,
} from "@/lib/api";
import type { VisitorStats, CrossingEvent, HourlyTraffic } from "@/lib/api";
import { useVisitorEvents } from "@/lib/use-websocket";
import { StatsCards } from "@/components/stats-cards";
import { EventFeed } from "@/components/event-feed";
import { HourlyChart } from "@/components/hourly-chart";
import { GenderChart } from "@/components/gender-chart";
import CameraFeed from "@/components/camera-feed";
import { SkeletonCard } from "@/components/skeleton-card";
import { Activity, RefreshCw } from "lucide-react";

const POLL_INTERVAL_MS = 5000;
const MAX_DISPLAYED_EVENTS = 20;

export default function DashboardPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<CrossingEvent[]>([]);
  const [hourlyTrafficData, setHourlyTrafficData] = useState<HourlyTraffic[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { latestEvent, isConnected } = useVisitorEvents();
  const previousLatestEventRef = useRef<CrossingEvent | null>(null);

  const refreshDashboardData = useCallback(async () => {
    try {
      const [fetchedStats, fetchedEvents, fetchedHourly] = await Promise.all([
        fetchVisitorStats(),
        fetchEvents({ limit: "20" }),
        fetchHourlyTraffic(),
      ]);
      setStats(fetchedStats);
      setRecentEvents(fetchedEvents);
      setHourlyTrafficData(fetchedHourly);
      setLastUpdated(new Date());
    } catch {
      // API not available yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboardData();
    const pollTimer = setInterval(refreshDashboardData, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer);
  }, [refreshDashboardData]);

  useEffect(() => {
    if (latestEvent && latestEvent !== previousLatestEventRef.current) {
      previousLatestEventRef.current = latestEvent;
      setRecentEvents((existingEvents) =>
        [latestEvent, ...existingEvents].slice(0, MAX_DISPLAYED_EVENTS)
      );
      fetchVisitorStats()
        .then((s) => {
          setStats(s);
          setLastUpdated(new Date());
        })
        .catch(() => {});
    }
  }, [latestEvent]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Dashboard
            </h1>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface border border-border-subtle">
              <span
                className={`relative flex h-2 w-2 ${
                  isConnected ? "" : "hidden"
                }`}
              >
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-accent-green" : "bg-accent-red"
                }`}
              />
              <span
                className={`text-[11px] font-medium ${
                  isConnected ? "text-accent-green" : "text-accent-red"
                }`}
              >
                {isConnected ? "Live" : "Disconnected"}
              </span>
            </div>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Real-time visitor tracking and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-text-muted">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refreshDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      {/* Camera Feed */}
      <CameraFeed />

      {/* Charts + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <HourlyChart data={hourlyTrafficData} />
          <GenderChart distribution={stats?.gender_distribution ?? null} />
        </div>
        <div className="lg:col-span-1">
          <EventFeed events={recentEvents} />
        </div>
      </div>
    </div>
  );
}
