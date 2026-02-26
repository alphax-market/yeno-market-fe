export interface MarketOutcome {
  id?: string;
  name: string;
  price?: number; 
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  imageUrl?: string;
  isLive?: boolean;
  trending?: boolean;
  outcomes?: MarketOutcome[]; // For multi-outcome markets
  change24h?: number; // 24h price change percentage
}

export const ashesMarkets: Market[] = [
  // Sri Lanka vs Pakistan 2026
  {
    id: "1",
    title: "Babar Azam to score 300+ runs in SL series",
    description: "Will Babar Azam score 300 or more runs in the Pakistan tour of Sri Lanka 2026?",
    category: "Cricket",
    yesPrice: 0.52,
    noPrice: 0.48,
    volume: 2800000,
    liquidity: 890000,
    endDate: "2026-02-15",
    isLive: true,
    trending: true,
  },
  {
    id: "2",
    title: "Sri Lanka to win by 2-0 margin",
    description: "Will Sri Lanka achieve a clean sweep against Pakistan?",
    category: "Cricket",
    yesPrice: 0.28,
    noPrice: 0.72,
    volume: 1650000,
    liquidity: 520000,
    endDate: "2026-02-15",
    isLive: true,
  },
  // SA20 2026
  {
    id: "3",
    title: "Quinton de Kock to be top scorer in SA20",
    description: "Will Quinton de Kock finish as the highest run scorer in SA20 2026?",
    category: "Cricket",
    yesPrice: 0.34,
    noPrice: 0.66,
    volume: 1200000,
    liquidity: 380000,
    endDate: "2026-02-08",
    trending: true,
  },
  {
    id: "4",
    title: "A 200+ team score in SA20 final",
    description: "Will either team score 200+ runs in the SA20 2026 final?",
    category: "Cricket",
    yesPrice: 0.45,
    noPrice: 0.55,
    volume: 980000,
    liquidity: 320000,
    endDate: "2026-02-08",
    isLive: true,
  },
  // BBL 2025-26
  {
    id: "5",
    title: "Glenn Maxwell to hit most sixes in BBL",
    description: "Will Glenn Maxwell hit the most sixes in BBL 2025-26?",
    category: "Cricket",
    yesPrice: 0.38,
    noPrice: 0.62,
    volume: 1450000,
    liquidity: 460000,
    endDate: "2026-01-27",
    trending: true,
    isLive: true,
  },
  {
    id: "6",
    title: "Perth Scorchers to reach finals",
    description: "Will Perth Scorchers qualify for the BBL 2025-26 finals?",
    category: "Cricket",
    yesPrice: 0.72,
    noPrice: 0.28,
    volume: 890000,
    liquidity: 280000,
    endDate: "2026-01-20",
    isLive: true,
  },
  // T20 World Cup 2026
  {
    id: "7",
    title: "Australia to win T20 World Cup 2026",
    description: "Will Australia win the ICC Men's T20 World Cup 2026?",
    category: "Cricket",
    yesPrice: 0.22,
    noPrice: 0.78,
    volume: 28000000,
    liquidity: 8500000,
    endDate: "2026-03-22",
    trending: true,
    isLive: true,
  },
  {
    id: "8",
    title: "England to reach T20 WC semi-finals",
    description: "Will England qualify for the semi-finals of T20 World Cup 2026?",
    category: "Cricket",
    yesPrice: 0.78,
    noPrice: 0.22,
    volume: 4200000,
    liquidity: 1200000,
    endDate: "2026-03-18",
    trending: true,
  },
];

export const politicalMarkets: Market[] = [
  {
    id: "p1",
    title: "Trump to announce 2028 endorsement by March",
    description: "Will Donald Trump publicly endorse a candidate for 2028 before March 31st?",
    category: "US Politics",
    yesPrice: 0.34,
    noPrice: 0.66,
    volume: 4200000,
    liquidity: 1450000,
    endDate: "2026-03-31",
    trending: true,
    isLive: true,
  },
  {
    id: "p2",
    title: "Elon Musk to run for political office",
    description: "Will Elon Musk announce a run for any political office in 2026?",
    category: "US Politics",
    yesPrice: 0.12,
    noPrice: 0.88,
    volume: 8900000,
    liquidity: 2100000,
    endDate: "2026-12-31",
    trending: true,
  },
  {
    id: "p3",
    title: "UK snap election called in 2026",
    description: "Will the UK government call a snap general election before 2027?",
    category: "UK Politics",
    yesPrice: 0.21,
    noPrice: 0.79,
    volume: 1890000,
    liquidity: 670000,
    endDate: "2026-12-31",
  },
  {
    id: "p4",
    title: "US Government shutdown in Q1 2026",
    description: "Will there be a federal government shutdown lasting 3+ days in Q1 2026?",
    category: "US Politics",
    yesPrice: 0.42,
    noPrice: 0.58,
    volume: 3450000,
    liquidity: 980000,
    endDate: "2026-03-31",
    isLive: true,
    trending: true,
  },
  {
    id: "p5",
    title: "TikTok ban upheld by Supreme Court",
    description: "Will the US Supreme Court uphold the TikTok ban ruling?",
    category: "Tech Policy",
    yesPrice: 0.67,
    noPrice: 0.33,
    volume: 12500000,
    liquidity: 3200000,
    endDate: "2026-06-30",
    trending: true,
    isLive: true,
  },
  {
    id: "p6",
    title: "Fed to cut rates in January 2026",
    description: "Will the Federal Reserve announce an interest rate cut at the January FOMC meeting?",
    category: "Economic Policy",
    yesPrice: 0.31,
    noPrice: 0.69,
    volume: 5800000,
    liquidity: 1890000,
    endDate: "2026-01-29",
    trending: true,
    isLive: true,
  },
  {
    id: "p7",
    title: "Trump to release Epstein documents",
    description: "Will President Trump declassify or release Epstein-related documents in 2026?",
    category: "US Politics",
    yesPrice: 0.45,
    noPrice: 0.55,
    volume: 9200000,
    liquidity: 2800000,
    endDate: "2026-12-31",
    trending: true,
    isLive: true,
  },
  {
    id: "p8",
    title: "Elon Musk to hit 200M X followers",
    description: "Will Elon Musk reach 200 million followers on X before July 2026?",
    category: "Social Media",
    yesPrice: 0.72,
    noPrice: 0.28,
    volume: 3400000,
    liquidity: 1200000,
    endDate: "2026-07-01",
    trending: true,
    isLive: true,
  },
  {
    id: "p9",
    title: "Ron DeSantis to resign as Florida Governor",
    description: "Will Ron DeSantis resign as Governor of Florida before the end of 2026?",
    category: "US Politics",
    yesPrice: 0.18,
    noPrice: 0.82,
    volume: 2750000,
    liquidity: 890000,
    endDate: "2026-12-31",
    trending: true,
    isLive: true,
  },
];
