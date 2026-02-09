import { Newspaper, Trophy, ExternalLink } from "lucide-react";
import { Market } from "@/data/markets";

interface RelevantSourcesProps {
  market: Market;
}

// Random placeholder headlines/scores for now – replace with real API later
const placeholderHeadlines: Record<string, string[]> = {
  politics: [
    "Polls show shift in key battleground states",
    "Policy briefing: What’s on the agenda",
    "Latest debate highlights",
  ],
  sports: [
    "Live: Score updates and key moments",
    "Table standings and form guide",
    "Injury and team news",
  ],
  cricket: [
    "Session summary and run rate",
    "Partnership and wicket updates",
    "Match situation report",
  ],
  crypto: [
    "Market movers and volatility",
    "On-chain and funding metrics",
    "Key level watch",
  ],
  default: [
    "Related updates",
    "Background and context",
    "More on this topic",
    "Latest developments",
    "Expert take",
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function getPlaceholderItems(category: string, count = 3): string[] {
  const key = Object.keys(placeholderHeadlines).find(
    (k) => k !== "default" && category.toLowerCase().includes(k)
  );
  const list = placeholderHeadlines[key || "default"] ?? placeholderHeadlines.default;
  return shuffle(list).slice(0, count);
}

export function RelevantSources({ market }: RelevantSourcesProps) {
  const category = (market as { category?: string }).category ?? "general";
  const items = getPlaceholderItems(category);
  const isSports =
    /sport|cricket|football|soccer|match|league|cup|series/i.test(category);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        {isSports ? (
          <Trophy className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Newspaper className="w-4 h-4 text-muted-foreground" />
        )}
        {isSports ? "Scores & updates" : "Relevant sources"}
      </h3>
      <ul className="space-y-2">
        {items.map((line, i) => (
          <li
            key={i}
            className="text-sm text-muted-foreground flex items-start gap-2 group"
          >
            <span className="text-primary/70 group-hover:text-primary">•</span>
            <span className="flex-1">{line}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        Sources and live data can be wired here by category.
      </p>
    </div>
  );
}
