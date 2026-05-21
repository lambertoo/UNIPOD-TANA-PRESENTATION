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

const POLL_INTERVAL_MS = 5000;
const MAX_DISPLAYED_EVENTS = 20;

export default function DashboardPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<CrossingEvent[]>([]);
  const [hourlyTrafficData, setHourlyTrafficData] = useState<HourlyTraffic[]>(
    []
  );
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
    } catch {
      // API not available yet
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
        .then(setStats)
        .catch(() => {});
    }
  }, [latestEvent]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
          title={isConnected ? "WebSocket connected" : "WebSocket disconnected"}
        />
        <span className="text-xs text-gray-500">
          {isConnected ? "Live" : "Disconnected"}
        </span>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <HourlyChart data={hourlyTrafficData} />
          <GenderChart
            distribution={stats?.gender_distribution ?? null}
          />
        </div>
        <div className="lg:col-span-1">
          <EventFeed events={recentEvents} />
        </div>
      </div>
    </div>
  );
}
