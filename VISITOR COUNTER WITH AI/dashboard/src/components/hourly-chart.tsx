"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { HourlyTraffic } from "@/lib/api";
import { BarChart3 } from "lucide-react";

interface HourlyChartProps {
  data: HourlyTraffic[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const formattedData = data.map((entry) => ({
    ...entry,
    hourLabel: `${entry.hour}:00`,
  }));

  const hasData = formattedData.some((d) => d.enter_count > 0 || d.exit_count > 0);

  return (
    <div className="bg-surface rounded-xl p-4 shadow-sm border border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-text-secondary" />
        <h2 className="text-base font-semibold text-text-primary">
          Hourly Traffic
        </h2>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">No traffic data yet</p>
          <p className="text-text-muted/70 text-xs mt-1">
            Crossing events will appear here
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              stroke="#4b5563"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={{ stroke: "#374151" }}
              tickLine={false}
            />
            <YAxis
              stroke="#4b5563"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                color: "#f3f4f6",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            />
            <Legend
              wrapperStyle={{ color: "#9ca3af", fontSize: "12px", paddingTop: "8px" }}
            />
            <Bar
              dataKey="enter_count"
              name="Entries"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="exit_count"
              name="Exits"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
