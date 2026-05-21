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

interface HourlyChartProps {
  data: HourlyTraffic[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const formattedData = data.map((entry) => ({
    ...entry,
    hourLabel: `${entry.hour}:00`,
  }));

  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3 text-gray-200">
        Hourly Traffic
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="hourLabel"
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#F9FAFB",
            }}
          />
          <Legend wrapperStyle={{ color: "#D1D5DB" }} />
          <Bar
            dataKey="enter_count"
            name="Entries"
            fill="#22C55E"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="exit_count"
            name="Exits"
            fill="#EF4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
