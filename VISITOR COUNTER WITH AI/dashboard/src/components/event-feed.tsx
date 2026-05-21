import type { CrossingEvent } from "@/lib/api";

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

function DirectionIndicator({ direction }: { direction: string }) {
  const isEntry = direction.toLowerCase() === "enter";
  return (
    <span
      className={`text-xl font-bold ${isEntry ? "text-green-400" : "text-red-400"}`}
    >
      {isEntry ? "↓" : "↑"}
    </span>
  );
}

function DirectionBadge({ direction }: { direction: string }) {
  const isEntry = direction.toLowerCase() === "enter";
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        isEntry
          ? "bg-green-500/20 text-green-300"
          : "bg-red-500/20 text-red-300"
      }`}
    >
      {direction}
    </span>
  );
}

export function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg h-full">
      <h2 className="text-lg font-semibold mb-3 text-gray-200">
        Live Event Feed
      </h2>
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {events.length === 0 && (
          <p className="text-gray-500 text-sm">No events yet</p>
        )}
        {events.map((crossingEvent) => (
          <div
            key={crossingEvent.id}
            className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2"
          >
            <DirectionIndicator direction={crossingEvent.direction} />
            <span className="text-sm font-medium text-gray-200">
              Visitor #{crossingEvent.visitor_id}
            </span>
            <DirectionBadge direction={crossingEvent.direction} />
            <span className="text-xs text-gray-500 ml-auto">
              {formatTimestamp(crossingEvent.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
