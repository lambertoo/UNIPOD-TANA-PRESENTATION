"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface GenderChartProps {
  distribution: { male: number; female: number } | null;
}

const GENDER_COLORS = {
  Male: "#3B82F6",
  Female: "#EC4899",
};

export function GenderChart({ distribution }: GenderChartProps) {
  if (!distribution) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">
          Gender Distribution
        </h2>
        <p className="text-gray-500 text-sm">No data available</p>
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
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-3 text-gray-200">
        Gender Distribution
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={renderPercentageLabel}
            labelLine={{ stroke: "#6B7280" }}
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
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#F9FAFB",
            }}
          />
          <Legend wrapperStyle={{ color: "#D1D5DB" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
