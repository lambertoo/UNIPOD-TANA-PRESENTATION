"use client";

import { useState, useEffect } from "react";
import { fetchHealth } from "@/lib/api";
import type { HealthStatus } from "@/lib/api";
import { SkeletonText } from "@/components/skeleton-card";
import {
  Settings,
  Database,
  Clock,
  Users,
  CheckCircle2,
  Shield,
  HardDrive,
} from "lucide-react";

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setHealth(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Unable to connect to the API server");
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          System status and configuration
        </p>
      </div>

      {/* System Health */}
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
        <div className="flex items-center gap-2 mb-5">
          <CheckCircle2 className="w-4 h-4 text-accent-green" />
          <h2 className="text-base font-semibold text-text-primary">
            System Health
          </h2>
        </div>

        {isLoading ? (
          <SkeletonText lines={3} />
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-red/5 border border-accent-red/20">
            <div className="w-2 h-2 rounded-full bg-accent-red" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-surface-elevated/30 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-accent-green" />
                <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                  Status
                </span>
              </div>
              <p className="text-lg font-semibold text-accent-green capitalize">
                {health.status}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-elevated/30 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-accent-blue" />
                <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                  Database Size
                </span>
              </div>
              <p className="text-lg font-semibold text-text-primary">
                {health.database_size_mb} MB
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-elevated/30 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-accent-purple" />
                <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                  Total Visitors
                </span>
              </div>
              <p className="text-lg font-semibold text-text-primary">
                {health.total_visitors}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-elevated/30 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-accent-orange" />
                <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                  Uptime
                </span>
              </div>
              <p className="text-lg font-semibold text-text-primary">
                {formatUptime(health.uptime_seconds)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Privacy */}
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-accent-blue" />
          <h2 className="text-base font-semibold text-text-primary">
            Privacy & Security
          </h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated/30 border border-border-subtle">
            <HardDrive className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Local-Only Storage
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                All visitor data, photos, and analytics are stored locally on this
                machine. No data is transmitted over the network.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated/30 border border-border-subtle">
            <Shield className="w-4 h-4 text-text-secondary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Irreversible Embeddings
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Face embeddings are numerical vectors that cannot be reversed
                back into photos. Photos are stored separately on the local
                filesystem.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-4 h-4 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">
            Configuration
          </h2>
        </div>
        <p className="text-sm text-text-secondary">
          System configuration is managed through the{" "}
          <code className="px-1.5 py-0.5 rounded bg-surface-elevated text-text-primary text-xs">
            config.yaml
          </code>{" "}
          file in the project root. Restart the camera daemon after making
          changes.
        </p>
      </div>
    </div>
  );
}
