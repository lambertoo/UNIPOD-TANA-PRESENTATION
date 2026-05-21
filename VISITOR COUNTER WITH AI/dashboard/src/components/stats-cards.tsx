import type { VisitorStats } from "@/lib/api";
import { Users, DoorOpen, Activity, UsersRound } from "lucide-react";

interface StatsCardsProps {
  stats: VisitorStats | null;
}

const CARD_CONFIG = [
  {
    label: "Currently Inside",
    icon: DoorOpen,
    colorClass: "border-accent-blue bg-accent-blue/5",
    numberClass: "text-accent-blue",
    iconClass: "text-accent-blue",
    getValue: (s: VisitorStats) => s.total_inside,
  },
  {
    label: "Total Visitors",
    icon: Users,
    colorClass: "border-accent-purple bg-accent-purple/5",
    numberClass: "text-accent-purple",
    iconClass: "text-accent-purple",
    getValue: (s: VisitorStats) => s.total_visitors,
  },
  {
    label: "Events Today",
    icon: Activity,
    colorClass: "border-accent-green bg-accent-green/5",
    numberClass: "text-accent-green",
    iconClass: "text-accent-green",
    getValue: (s: VisitorStats) => s.total_events_today,
  },
  {
    label: "Male / Female",
    icon: UsersRound,
    colorClass: "border-accent-orange bg-accent-orange/5",
    numberClass: "text-accent-orange",
    iconClass: "text-accent-orange",
    getValue: (s: VisitorStats) =>
      `${s.gender_distribution.male} / ${s.gender_distribution.female}`,
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {CARD_CONFIG.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl border-l-4 p-5 shadow-sm bg-surface border border-border-subtle ${card.colorClass}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-text-secondary font-medium">
                {card.label}
              </p>
              <div className={`p-1.5 rounded-md bg-surface-elevated/50`}>
                <Icon className={`w-4 h-4 ${card.iconClass}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${card.numberClass}`}>
              {stats ? card.getValue(stats) : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
