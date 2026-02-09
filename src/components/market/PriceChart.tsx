import { useMemo, useState } from "react";
import { Area, AreaChart, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Market } from "@/data/markets";
import { ChartContainer } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useMarketChart } from "@/hooks/useMarkets";

const isApiMarket = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface PriceChartProps {
  market: Market;
}

type TimeFilter = "1H" | "1D" | "1W" | "1M";

// Color palette for multi-outcome charts
const outcomeColors = [
  "hsl(142 76% 36%)", // green
  "hsl(221 83% 53%)", // blue
  "hsl(280 65% 60%)", // purple
  "hsl(45 93% 47%)",  // yellow
  "hsl(0 72% 51%)",   // red
  "hsl(173 80% 40%)", // teal
  "hsl(330 80% 60%)", // pink
  "hsl(25 95% 53%)",  // orange
];

// Get number of data points based on time filter
function getDataPoints(filter: TimeFilter): { points: number; format: string } {
  switch (filter) {
    case "1H": return { points: 12, format: "time" };
    case "1D": return { points: 24, format: "time" };
    case "1W": return { points: 7, format: "day" };
    case "1M": return { points: 30, format: "date" };
  }
}

// Generate mock historical data for multi-outcome markets
function generateMultiOutcomeData(outcomes: { name: string; price: number }[], filter: TimeFilter) {
  const { points, format } = getDataPoints(filter);
  const data = [];
  
  let prices = outcomes.map(o => o.price - 0.1 + Math.random() * 0.05);
  
  for (let i = points; i >= 0; i--) {
    const date = new Date();
    let label: string;
    
    if (format === "time") {
      date.setMinutes(date.getMinutes() - i * (filter === "1H" ? 5 : 60));
      label = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (format === "day") {
      date.setDate(date.getDate() - i);
      label = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      date.setDate(date.getDate() - i);
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    const point: Record<string, any> = { date: label };
    
    prices = prices.map((price, idx) => {
      const change = (Math.random() - 0.48) * 0.03;
      let newPrice = Math.max(0.02, Math.min(0.95, price + change));
      if (i < 3) {
        newPrice = newPrice + (outcomes[idx].price - newPrice) * 0.3;
      }
      return newPrice;
    });
    
    const total = prices.reduce((a, b) => a + b, 0);
    prices = prices.map(p => p / total);
    
    outcomes.forEach((outcome, idx) => {
      point[outcome.name] = Math.round(prices[idx] * 100);
    });
    
    data.push(point);
  }
  
  return data;
}

// Generate mock historical data for binary markets
function generateBinaryData(currentPrice: number, filter: TimeFilter) {
  const { points, format } = getDataPoints(filter);
  const data = [];
  let price = currentPrice - 0.15 + Math.random() * 0.1;
  
  for (let i = points; i >= 0; i--) {
    const date = new Date();
    let label: string;
    
    if (format === "time") {
      date.setMinutes(date.getMinutes() - i * (filter === "1H" ? 5 : 60));
      label = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (format === "day") {
      date.setDate(date.getDate() - i);
      label = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      date.setDate(date.getDate() - i);
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    const change = (Math.random() - 0.48) * 0.04;
    price = Math.max(0.05, Math.min(0.95, price + change));
    
    if (i < 3) {
      price = price + (currentPrice - price) * 0.3;
    }
    
    data.push({
      date: label,
      Yes: Math.round(price * 100),
      No: Math.round((1 - price) * 100),
    });
  }
  
  return data;
}

// Custom tooltip component that shows all outcomes
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.dataKey}</span>
            </div>
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const timeFilterToRange = { "1H": "1h" as const, "1D": "6h" as const, "1W": "24h" as const, "1M": "7d" as const };

export function PriceChart({ market }: PriceChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("1M");
  const hasMultipleOutcomes = market.outcomes && market.outcomes.length > 2;
  const apiChartRange = timeFilterToRange[timeFilter];
  const { data: apiSnapshots } = useMarketChart(
    market.id,
    isApiMarket(market.id) ? apiChartRange : "24h"
  );

  const { data, outcomes, chartConfig } = useMemo(() => {
    if (hasMultipleOutcomes) {
      const outcomesList = market.outcomes!;
      const config: Record<string, { label: string; color: string }> = {};
      outcomesList.forEach((outcome, idx) => {
        config[outcome.name] = {
          label: outcome.name,
          color: outcomeColors[idx % outcomeColors.length],
        };
      });
      return {
        data: generateMultiOutcomeData(outcomesList, timeFilter),
        outcomes: outcomesList,
        chartConfig: config,
      };
    }
    if (isApiMarket(market.id) && apiSnapshots && apiSnapshots.length > 0) {
      const data = apiSnapshots.map((s) => ({
        date: new Date(s.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        Yes: Math.round(Number(s.yesPrice) * 100),
        No: Math.round(Number(s.noPrice) * 100),
      }));
      return {
        data,
        outcomes: [{ name: "Yes", price: market.yesPrice }, { name: "No", price: market.noPrice }],
        chartConfig: {
          Yes: { label: "Yes", color: "hsl(142 76% 36%)" },
          No: { label: "No", color: "hsl(0 72% 51%)" },
        },
      };
    }
    return {
      data: generateBinaryData(Number(market.yesPrice), timeFilter),
      outcomes: [{ name: "Yes", price: market.yesPrice }, { name: "No", price: market.noPrice }],
      chartConfig: {
        Yes: { label: "Yes", color: "hsl(142 76% 36%)" },
        No: { label: "No", color: "hsl(0 72% 51%)" },
      },
    };
  }, [market, hasMultipleOutcomes, timeFilter, apiSnapshots]);

  const timeFilters: TimeFilter[] = ["1H", "1D", "1W", "1M"];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-semibold">Price History</h3>
        <div className="flex items-center gap-1">
          {timeFilters.map((filter) => (
            <Button
              key={filter}
              variant={timeFilter === filter ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTimeFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Legend with percentages */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {outcomes.map((outcome, idx) => {
          const percentage = Math.round(outcome.price * 100);
          const color = hasMultipleOutcomes 
            ? outcomeColors[idx % outcomeColors.length] 
            : (outcome.name === "Yes" ? "hsl(142 76% 36%)" : "hsl(0 72% 51%)");
          return (
            <div key={outcome.name} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-muted-foreground">{outcome.name}</span>
              <span className="text-sm font-semibold" style={{ color }}>
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
      
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {outcomes.map((outcome, idx) => {
              const color = hasMultipleOutcomes 
                ? outcomeColors[idx % outcomeColors.length]
                : (outcome.name === "Yes" ? "hsl(142 76% 36%)" : "hsl(0 72% 51%)");
              return (
                <linearGradient key={outcome.name} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 20% 18%)" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
            tickMargin={8}
          />
          <YAxis 
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          {outcomes.map((outcome, idx) => {
            const color = hasMultipleOutcomes 
              ? outcomeColors[idx % outcomeColors.length]
              : (outcome.name === "Yes" ? "hsl(142 76% 36%)" : "hsl(0 72% 51%)");
            return (
              <Area
                key={outcome.name}
                type="monotone"
                dataKey={outcome.name}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${idx})`}
              />
            );
          })}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
