import { Market } from "@/data/markets";
import { Calendar, CheckCircle, Clock, ExternalLink, FileText, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResolutionInfoProps {
  market: Market;
}

export function ResolutionInfo({ market }: ResolutionInfoProps) {
  const endDate = new Date(market.endDate);
  const now = new Date();
  const isResolved = endDate < now;
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-6">
      {/* Resolution Status */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Resolution Status
        </h3>
        
        <div className="flex items-center gap-3 mb-4">
          <Badge 
            variant={isResolved ? "default" : "secondary"}
            className={isResolved ? "bg-success text-success-foreground" : ""}
          >
            {isResolved ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Resolved</>
            ) : (
              <><Clock className="w-3 h-3 mr-1" /> Pending</>
            )}
          </Badge>
          {!isResolved && daysRemaining > 0 && (
            <span className="text-sm text-muted-foreground">
              {daysRemaining} days remaining
            </span>
          )}
        </div>
      </div>

      {/* Resolution Details */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          Resolution Date
        </h4>
        <p className="text-foreground">
          {endDate.toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
      </div>

      {/* Resolution Rules */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Resolution Rules
        </h4>
        <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground space-y-3">
          <p>
            This market will resolve to <span className="text-success font-medium">Yes</span> if the 
            condition described in the market title is met by the resolution date.
          </p>
          <p>
            This market will resolve to <span className="text-destructive font-medium">No</span> if the 
            condition is not met by the resolution date.
          </p>
          <p>
            Resolution will be determined based on credible news sources and official announcements.
          </p>
        </div>
      </div>

      {/* Resolution Sources */}
      <div>
        <h4 className="text-sm font-medium mb-3">Resolution Sources</h4>
        <div className="space-y-2">
          {["Official government announcements", "Major news outlets (Reuters, AP, Bloomberg)", "Verified social media posts"].map((source, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>{source}</span>
            </div>
          ))}
        </div>
      </div>

      {/* View Resolved Markets Link */}
      <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary hover:underline border-t border-border pt-4">
        <ExternalLink className="w-4 h-4" />
        View All Resolved Markets
      </button>
    </div>
  );
}
