import { LucideIcon } from "lucide-react";

export interface StatCard {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  indicator?: {
    color: string; // e.g., "bg-green-500", "bg-red-500"
  };
}

interface StatsCardsProps {
  stats: StatCard[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              {Icon ? (
                <Icon className="h-4 w-4 text-muted-foreground" />
              ) : stat.indicator ? (
                <div
                  className={`h-2 w-2 rounded-full ${stat.indicator.color}`}
                />
              ) : null}
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
