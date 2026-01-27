import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import MarketDetail from "./pages/MarketDetail";
import Profile from "./pages/Profile";
import CreatorTerminal from "./pages/CreatorTerminal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/market/:id" element={<MarketDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/creator" element={<CreatorTerminal />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
