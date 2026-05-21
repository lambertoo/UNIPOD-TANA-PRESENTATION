"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PieChartIcon } from "lucide-react";

interface GenderChartProps {
  distribution: { male: number; female: number } | null;
}

const GENDER_COLORS = {
  Male: "#3b82f6",
  Female: "#ec4899",
};

export function GenderChart({ distribution }: GenderChartProps) {
  if (!distribution) {
    return (
      <div className="bg-surface rounded-xl p-4 shadow-sm border border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <PieChartIcon className="w-4 h-4 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">
            Gender Distribution
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center h-[250px] text-center">
          <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
            <PieChartIcon className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const totalVisitors = distribution.male + distribution.female;
  const chartData = [
    { name: "Male", value: distribution.male },
    { name: "Female", value: distribution.female },
  ];

  const renderPercentageLabel = ({
    name,
    value,
  }: {
    name: string;
    value: number;
  }) => {
    const percentage =
      totalVisitors > 0 ? ((value / totalVisitors) * 100).toFixed(1) : "0";
    return `${name}: ${percentage}%`;
  };

  return (
    <div className="bg-surface rounded-xl p-4 shadow-sm border border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <PieChartIcon className="w-4 h-4 text-text-secondary" />
        <h2 className="text-base font-semibold text-text-primary">
          Gender Distribution
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={renderPercentageLabel}
            labelLine={{ stroke: "#4b5563" }}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={GENDER_COLORS[entry.name as keyof typeof GENDER_COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
