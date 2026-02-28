import { ChevronRight, Globe } from 'lucide-react';
import React, { useMemo, useRef } from 'react'
import { TrendingCard } from './TrendingCard';
import BackgroundImage from '@/assets/png/background-trending.png'

const TrendingCardRow = () => {

    const trendingScrollRef = useRef<HTMLDivElement>(null);


  const hardcodedTrendingCards = useMemo(
    () => [
      {
        id: "1",
        title:
          "Will The Tortured Poets Department be Billboard's album of the year?",
        yesPrice: 0.35,
        noPrice: 0.65,
        tradeAmount: 15200,
        date: "21 Feb",
      },
      {
        id: "2",
        title: "Will Bitcoin reach $100k before end of 2025?",
        yesPrice: 0.48,
        noPrice: 0.52,
        tradeAmount: 84500,
        date: "31 Dec",
      },
      {
        id: "3",
        title: "Will India win the next ICC World Cup?",
        yesPrice: 0.42,
        noPrice: 0.58,
        tradeAmount: 23100,
        date: "15 Mar",
      },
      {
        id: "4",
        title: "Will there be a Fed rate cut in March 2025?",
        yesPrice: 0.62,
        noPrice: 0.38,
        tradeAmount: 52000,
        date: "20 Mar",
      },
      {
        id: "5",
        title: "Will OpenAI release GPT-5 before July 2025?",
        yesPrice: 0.28,
        noPrice: 0.72,
        tradeAmount: 18900,
        date: "1 Jul",
      },
    ],
    [],
  );

  const scrollTrendingRight = () => {
    if (trendingScrollRef.current) {
      trendingScrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div
      className="mb-2 rounded-2xl bg-cover bg-center bg-no-repeat p-3 sm:p-4 overflow-hidden"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
    <div className="flex items-center justify-between mb-3 py-1 px-2 -mx-2 rounded-lg bg-gradient-to-r from-success/5 to-transparent">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-muted-foreground" />
        <h2 className="font-plus-jakarta font-semibold text-[16px] leading-[20px]  text-white">
          Trending Questions
        </h2>
      </div>
      <button
        type="button"
        onClick={scrollTrendingRight}
        className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Scroll to more"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
    <div
      ref={trendingScrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {hardcodedTrendingCards.map((card) => (
        <div key={card.id} className="snap-start shrink-0 h-full">
          <TrendingCard
            title={card.title}
            yesPrice={card.yesPrice}
            noPrice={card.noPrice}
            tradeAmount={card.tradeAmount}
            date={card.date}
            onClick={() => {
            //   if (filteredMarkets[0]) onSelectMarket(filteredMarkets[0]);
            }}
            onYes={(e) => {
              e.stopPropagation();
            //   if (filteredMarkets[0]) onSelectMarket(filteredMarkets[0]);
            }}
            onNo={(e) => {
              e.stopPropagation();
            //   if (filteredMarkets[0]) onSelectMarket(filteredMarkets[0]);
            }}
          />
        </div>
      ))}
    </div>
  </div>
  )
}

export default TrendingCardRow