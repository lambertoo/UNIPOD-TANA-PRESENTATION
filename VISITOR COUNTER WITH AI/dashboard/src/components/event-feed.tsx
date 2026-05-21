import type { CrossingEvent } from "@/lib/api";
import { getVisitorPhotoUrl } from "@/lib/api";
import { LogIn, LogOut, Radio } from "lucide-react";

interface EventFeedProps {
  events: CrossingEvent[];
}

function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function DirectionBadge({ direction }: { direction: string }) {
  const isEntry = direction.toLowerCase() === "enter";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
        isEntry
          ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
          : "bg-accent-red/10 text-accent-red border border-accent-red/20"
      }`}
    >
      {isEntry ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
      {isEntry ? "Enter" : "Exit"}
    </span>
  );
}

export function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="bg-surface rounded-xl p-4 shadow-sm border border-border-subtle h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-accent-red" />
        <h2 className="text-base font-semibold text-text-primary">
          Live Event Feed
        </h2>
        <span className="ml-auto text-[11px] text-text-muted font-medium">
          {events.length} events
        </span>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 flex-1">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
              <Radio className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-text-muted text-sm">No events yet</p>
            <p className="text-text-muted/70 text-xs mt-1">
              Waiting for crossings...
            </p>
          </div>
        )}
        {events.map((crossingEvent, index) => (
          <div
            key={`${crossingEvent.id}-${index}`}
            className="flex items-center gap-3 bg-surface-elevated/40 hover:bg-surface-elevated/70 rounded-lg px-3 py-2.5 border border-border-subtle transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="w-8 h-8 rounded-full bg-surface-elevated overflow-hidden flex-shrink-0 border border-border-subtle">
              <img
                src={getVisitorPhotoUrl(crossingEvent.visitor_id)}
                alt={`Visitor ${crossingEvent.visitor_id}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-text-primary block truncate">
                Visitor #{crossingEvent.visitor_id}
              </span>
            </div>
            <DirectionBadge direction={crossingEvent.direction} />
            <span className="text-[11px] text-text-muted font-mono flex-shrink-0">
              {formatTimestamp(crossingEvent.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
