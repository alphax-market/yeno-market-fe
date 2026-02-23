import { useNavigate } from "react-router-dom";
import { BarChart2, Clock, TrendingUp } from "lucide-react";
import { formatVolume } from "@/lib/utils";

export interface SimilarEvent {
  id: string;
  title: string;
  volume: number | string;
  endDate: string; // ISO or "DD Mon" display
  yesChancesPct: number; // 0–100
  imageUrl: string;
}

const HARDCODED_SIMILAR_EVENTS: SimilarEvent[] = [
  {
    id: "similar-1",
    title: "Will The Tortured Poets Department be Billboard's album of the year?",
    volume: 15200,
    endDate: "21 Feb",
    yesChancesPct: 32,
    imageUrl: "https://picsum.photos/seed/similar1/160/160",
  },
  {
    id: "similar-2",
    title: "Will Sri Lanka win the Test series 2–0?",
    volume: 8450,
    endDate: "28 Feb",
    yesChancesPct: 28,
    imageUrl: "https://picsum.photos/seed/similar2/160/160",
  },
  {
    id: "similar-3",
    title: "Will Bitcoin reach $100k by end of March?",
    volume: 125000,
    endDate: "31 Mar",
    yesChancesPct: 45,
    imageUrl: "https://picsum.photos/seed/similar3/160/160",
  },
  {
    id: "similar-4",
    title: "Will the Fed cut rates in the next meeting?",
    volume: 89200,
    endDate: "15 Mar",
    yesChancesPct: 62,
    imageUrl: "https://picsum.photos/seed/similar4/160/160",
  },
  {
    id: "similar-5",
    title: "Will India win the T20 World Cup 2026?",
    volume: 210000,
    endDate: "12 Jun",
    yesChancesPct: 38,
    imageUrl: "https://picsum.photos/seed/similar5/160/160",
  },
];

function SimilarEventCard({
  event,
  onSelect,
}: {
  event: SimilarEvent;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className="flex-shrink-0 w-[308px] sm:w-[320px] text-left rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-border/80 transition-all overflow-hidden"
    >
      <div className="flex gap-4 p-4">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Top metadata row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5 shrink-0" />
              {formatVolume(event.volume)}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {event.endDate}
            </span>
          </div>
          {/* Title */}
          <p className="text-base font-medium text-foreground line-clamp-3 leading-snug">
            {event.title}
          </p>
          {/* Chances */}
          <div className="flex items-center gap-1.5 text-sm text-success mt-0.5">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{event.yesChancesPct}%</span>
            <span className="font-normal">Chances</span>
          </div>
        </div>
        {/* Thumbnail */}
        <div className="shrink-0 w-24 h-24 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted">
          <img
            src={event.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </button>
  );
}

export function SimilarEventsWidget() {
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    // If id looks like a real market id, navigate; else do nothing or go to feed
    if (id.startsWith("similar-")) {
      navigate("/");
      return;
    }
    navigate(`/market/${id}`);
  };

  return (
    <section className="w-full container mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Similar Events</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {HARDCODED_SIMILAR_EVENTS.map((event) => (
          <SimilarEventCard
            key={event.id}
            event={event}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  );
}
