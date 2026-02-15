import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import MarketDetail from "./pages/MarketDetail";
import Profile from "./pages/Profile";
import CreatorTerminal from "./pages/CreatorTerminal";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { MarketsRealtimeSync } from "./components/MarketsRealtimeSync";

const queryClient = new QueryClient();
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "";

// Solana connectors for external wallets (Phantom etc.)
const solanaConnectors = toSolanaWalletConnectors({ shouldAutoConnect: false });

const router = createBrowserRouter(
  [
    { path: "/", element: <Index /> },
    { path: "/market/:id", element: <MarketDetail /> },
    { path: "/profile", element: <Profile /> },
    { path: "/creator", element: <CreatorTerminal /> },
    { path: "/admin", element: <Admin /> },
    { path: "/admin/login", element: <Admin /> },
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

if (!PRIVY_APP_ID && import.meta.env.DEV) {
  console.error(
    "⚠️ Privy App ID is missing!\n" +
      "Please create a .env file in the root directory with:\n" +
      "VITE_PRIVY_APP_ID=your_privy_app_id_here\n\n" +
      "Get your App ID from: https://dashboard.privy.io"
  );
}

const App = () => {
  if (!PRIVY_APP_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 space-y-4">
          {/* ... unchanged ... */}
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "twitter", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "/logo.svg",
          // ✅ app stays multi-chain
          walletChainType: "ethereum-and-solana",
        },
        embeddedWallets: {
          // ✅ ensures embedded wallet is created for social logins
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false,
        },
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <MarketsRealtimeSync />
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RouterProvider router={router} />
          </TooltipProvider>
        </WalletProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};

export default App;
