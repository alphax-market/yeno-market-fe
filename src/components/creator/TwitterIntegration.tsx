import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Twitter, 
  Share2, 
  Code, 
  RefreshCw,
  CheckCircle,
  Copy,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { formatPrice } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const TwitterIntegration = () => {
  const { toast } = useToast();
  const { user } = useWallet();
  const queryClient = useQueryClient();
  const [twitterUsername, setTwitterUsername] = useState("");
  const [tweetContent, setTweetContent] = useState("");
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [includeLink, setIncludeLink] = useState(true);

  // Creator profile/markets not available (no Supabase)
  const { data: profile = null, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => null,
    enabled: !!user?.id
  });

  const { data: markets = [] } = useQuery({
    queryKey: ["creator-markets-for-twitter", user?.id],
    queryFn: async () => [],
    enabled: !!user?.id
  });

  const updateTwitterMutation = useMutation({
    mutationFn: async (_username: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Twitter username saved!" });
    },
    onError: (error: any) => {
      toast({ title: "Error saving username", description: error.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (profile?.twitter_username) {
      setTwitterUsername(profile.twitter_username);
    }
  }, [profile]);

  useEffect(() => {
    if (markets.length > 0 && !selectedMarketId) {
      setSelectedMarketId(markets[0].id);
    }
  }, [markets, selectedMarketId]);

  const selectedMarket = markets.find((m: any) => m.id === selectedMarketId);

  useEffect(() => {
    if (selectedMarket) {
      const defaultTweet = `🔮 Check out this prediction market!\n\n"${selectedMarket.title}"\n\nCurrent odds: ${(selectedMarket.yes_price * 100).toFixed(0)}% YES\n\nTrade now 👇`;
      setTweetContent(defaultTweet);
    }
  }, [selectedMarket]);

  const handleConnectTwitter = () => {
    const cleanUsername = twitterUsername.replace("@", "").trim();
    if (!cleanUsername) {
      toast({ title: "Please enter a Twitter username", variant: "destructive" });
      return;
    }
    updateTwitterMutation.mutate(cleanUsername);
  };

  const handleDisconnect = () => {
    updateTwitterMutation.mutate("");
    setTwitterUsername("");
  };

  const handleShareToTwitter = () => {
    if (!selectedMarket) {
      toast({ title: "Please select a market to share", variant: "destructive" });
      return;
    }

    let fullTweet = tweetContent;
    if (includeLink) {
      const marketUrl = `${window.location.origin}/market/${selectedMarket.id}`;
      fullTweet += `\n\n${marketUrl}`;
    }

    const encodedTweet = encodeURIComponent(fullTweet);
    window.open(`https://twitter.com/intent/tweet?text=${encodedTweet}`, "_blank", "width=550,height=420");
  };

  const handleCopyEmbed = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard"
    });
  };

  const isConnected = !!profile?.twitter_username;

  const sampleEmbedCode = selectedMarket 
    ? `<div class="prediction-embed" data-market-id="${selectedMarket.id}">
  <script src="${window.location.origin}/embed.js"></script>
</div>`
    : `<div class="prediction-embed" data-market-id="YOUR_MARKET_ID">
  <script src="${window.location.origin}/embed.js"></script>
</div>`;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            Twitter / X Integration
          </CardTitle>
          <CardDescription>
            Connect your Twitter account to share markets easily
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
                  <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@{profile?.twitter_username}</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <a 
                    href={`https://twitter.com/${profile?.twitter_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    View profile →
                  </a>
                </div>
              </div>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
                <Twitter className="w-8 h-8 text-[#1DA1F2]" />
              </div>
              <h3 className="font-medium mb-2">Connect your Twitter account</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Enter your Twitter username to enable easy sharing of your markets
              </p>
              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    placeholder="username"
                    value={twitterUsername.replace("@", "")}
                    onChange={(e) => setTwitterUsername(e.target.value.replace("@", ""))}
                    className="pl-8"
                  />
                </div>
                <Button 
                  onClick={handleConnectTwitter}
                  disabled={updateTwitterMutation.isPending}
                >
                  {updateTwitterMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Twitter className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Tabs defaultValue="share" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="share">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </TabsTrigger>
            <TabsTrigger value="embed">
              <Code className="w-4 h-4 mr-2" />
              Embed
            </TabsTrigger>
            <TabsTrigger value="autopost">
              <RefreshCw className="w-4 h-4 mr-2" />
              Auto-Post
            </TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share to Twitter</CardTitle>
                <CardDescription>
                  Compose and share market updates to your followers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Market</Label>
                  <select 
                    className="w-full p-2 rounded-md border bg-background"
                    value={selectedMarketId}
                    onChange={(e) => setSelectedMarketId(e.target.value)}
                  >
                    {markets.length === 0 ? (
                      <option value="">No markets available</option>
                    ) : (
                      markets.map((market: any) => (
                        <option key={market.id} value={market.id}>
                          {market.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tweet Content</Label>
                  <Textarea 
                    placeholder="Write your tweet..."
                    value={tweetContent}
                    onChange={(e) => setTweetContent(e.target.value)}
                    rows={5}
                  />
                  <p className={`text-xs text-right ${tweetContent.length > 280 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {tweetContent.length} / 280
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    id="include-link" 
                    checked={includeLink}
                    onCheckedChange={setIncludeLink}
                  />
                  <Label htmlFor="include-link">Include market link</Label>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleShareToTwitter}
                  disabled={!selectedMarket || tweetContent.length > 280}
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Post to Twitter
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Embed Voting Widget</CardTitle>
                <CardDescription>
                  Let users vote on your predictions directly from your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Market</Label>
                  <select 
                    className="w-full p-2 rounded-md border bg-background"
                    value={selectedMarketId}
                    onChange={(e) => setSelectedMarketId(e.target.value)}
                  >
                    {markets.length === 0 ? (
                      <option value="">No markets available</option>
                    ) : (
                      markets.map((market: any) => (
                        <option key={market.id} value={market.id}>
                          {market.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Preview */}
                {selectedMarket && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-sm font-medium mb-3">Widget Preview</p>
                    <div className="bg-card rounded-lg border p-4">
                      <p className="font-medium mb-3">{selectedMarket.title}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="border-green-500/50 hover:bg-green-500/10">
                          Yes {formatPrice(selectedMarket.yes_price)}
                        </Button>
                        <Button variant="outline" className="border-red-500/50 hover:bg-red-500/10">
                          No {formatPrice(selectedMarket.no_price)}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Powered by PredictX
                      </p>
                    </div>
                  </div>
                )}

                {/* Embed Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Embed Code</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopyEmbed(sampleEmbedCode)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
                    {sampleEmbedCode}
                  </pre>
                </div>

                <div className="p-3 rounded-lg border bg-[#1DA1F2]/5 border-[#1DA1F2]/20">
                  <div className="flex items-start gap-2">
                    <Twitter className="w-4 h-4 mt-0.5 text-[#1DA1F2]" />
                    <div className="text-sm">
                      <p className="font-medium">Twitter Card Support</p>
                      <p className="text-muted-foreground">
                        When shared on Twitter, your market link will display a preview card
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto-Post Tab */}
          <TabsContent value="autopost">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auto-Post Settings</CardTitle>
                <CardDescription>
                  Configure automatic posting (requires API integration)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border bg-muted/30 text-center">
                  <Twitter className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium mb-1">Coming Soon</p>
                  <p className="text-sm text-muted-foreground">
                    Automatic posting to Twitter requires API integration. For now, use the Share tab to manually post updates.
                  </p>
                </div>

                <div className="space-y-4 opacity-50 pointer-events-none">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label>Post on market creation</Label>
                      <p className="text-xs text-muted-foreground">
                        Share when you publish a new market
                      </p>
                    </div>
                    <Switch disabled />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label>Post on significant price moves</Label>
                      <p className="text-xs text-muted-foreground">
                        Share when price changes by more than 10%
                      </p>
                    </div>
                    <Switch disabled />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label>Post on resolution</Label>
                      <p className="text-xs text-muted-foreground">
                        Share the outcome when market resolves
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};