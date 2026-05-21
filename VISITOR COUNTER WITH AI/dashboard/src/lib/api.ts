export type Visitor = {
  id: number;
  gender: string;
  gender_confidence: number;
  photo_filename: string;
  first_seen_at: string;
  last_seen_at: string;
  is_inside: boolean;
};

export type CrossingEvent = {
  id: number;
  visitor_id: number;
  direction: string;
  timestamp: string;
  confidence: number;
  photo_filename: string;
};

export type VisitorStats = {
  total_inside: number;
  total_visitors: number;
  total_events_today: number;
  gender_distribution: { male: number; female: number };
};

export type HourlyTraffic = {
  hour: number;
  enter_count: number;
  exit_count: number;
};

export type VisitorDetail = Visitor & {
  events: CrossingEvent[];
};

export async function fetchVisitorStats(): Promise<VisitorStats> {
  const response = await fetch("/api/stats");
  return response.json();
}

export async function fetchVisitors(): Promise<Visitor[]> {
  const response = await fetch("/api/visitors");
  return response.json();
}

export async function fetchVisitorDetail(
  visitorId: number
): Promise<VisitorDetail> {
  const response = await fetch(`/api/visitors/${visitorId}`);
  return response.json();
}

export async function fetchEvents(
  params?: Record<string, string>
): Promise<CrossingEvent[]> {
  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : "";
  const response = await fetch(`/api/events${queryString}`);
  return response.json();
}

export async function fetchHourlyTraffic(
  date?: string
): Promise<HourlyTraffic[]> {
  const queryString = date ? `?date=${date}` : "";
  const response = await fetch(`/api/stats/hourly${queryString}`);
  return response.json();
}
