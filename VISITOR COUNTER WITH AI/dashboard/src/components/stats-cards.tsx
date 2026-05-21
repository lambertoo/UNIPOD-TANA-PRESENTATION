import type { VisitorStats } from "@/lib/api";

interface StatsCardsProps {
  stats: VisitorStats | null;
}

const CARD_STYLES = [
  {
    label: "Currently Inside",
    colorClass: "border-blue-500 bg-blue-500/10",
    numberClass: "text-blue-400",
    getValue: (s: VisitorStats) => s.total_inside,
  },
  {
    label: "Total Visitors",
    colorClass: "border-purple-500 bg-purple-500/10",
    numberClass: "text-purple-400",
    getValue: (s: VisitorStats) => s.total_visitors,
  },
  {
    label: "Events Today",
    colorClass: "border-green-500 bg-green-500/10",
    numberClass: "text-green-400",
    getValue: (s: VisitorStats) => s.total_events_today,
  },
  {
    label: "Male / Female",
    colorClass: "border-orange-500 bg-orange-500/10",
    numberClass: "text-orange-400",
    getValue: (s: VisitorStats) =>
      `${s.gender_distribution.male} / ${s.gender_distribution.female}`,
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARD_STYLES.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border-l-4 p-5 shadow-lg bg-gray-900 ${card.colorClass}`}
        >
          <p className="text-sm text-gray-400 mb-1">{card.label}</p>
          <p className={`text-3xl font-bold ${card.numberClass}`}>
            {stats ? card.getValue(stats) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
