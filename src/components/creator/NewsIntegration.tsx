import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Newspaper, 
  Zap, 
  RefreshCw, 
  ExternalLink,
  Clock,
  TrendingUp,
  CheckCircle,
  Plus,
  Sparkles,
  X,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const defaultCategories = ["crypto", "technology", "finance", "politics", "sports", "science"];

const categoryColors: Record<string, string> = {
  finance: "bg-green-500/10 text-green-500",
  technology: "bg-blue-500/10 text-blue-500",
  science: "bg-purple-500/10 text-purple-500",
  crypto: "bg-orange-500/10 text-orange-500",
  politics: "bg-red-500/10 text-red-500",
  sports: "bg-yellow-500/10 text-yellow-500",
  news: "bg-gray-500/10 text-gray-500"
};

export const NewsIntegration = () => {
  const { toast } = useToast();
  const { user } = useWallet();
  const queryClient = useQueryClient();
  const [autoCreateEnabled, setAutoCreateEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["crypto", "technology", "finance"]);
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [rssUrl, setRssUrl] = useState("");
  const [rssSources, setRssSources] = useState<string[]>([]);

  // News topics not available (no Supabase)
  const { data: newsTopics = [], isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["news-topics"],
    queryFn: async () => []
  });

  // Validation constants matching database constraints
  const TITLE_MIN_LENGTH = 10;
  const TITLE_MAX_LENGTH = 200;
  const DESCRIPTION_MAX_LENGTH = 5000;
  const VALID_CATEGORIES = ["crypto", "politics", "sports", "entertainment", "technology", "finance", "science", "general", "news"];

  // Helper function to sanitize and truncate strings
  const sanitizeString = (str: string | null | undefined, maxLength: number): string => {
    if (!str) return '';
    return str.trim().substring(0, maxLength);
  };

  const createMarketMutation = useMutation({
    mutationFn: async (_newsItem: any) => {
      throw new Error("Market creation is not available on this environment.");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["news-topics"] });
      queryClient.invalidateQueries({ queryKey: ["creator-markets"] });
      toast({
        title: "Market created from news!",
        description: `"${data.title}" has been created as a draft market`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating market",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchNews();
    setIsRefreshing(false);
    toast({
      title: "News refreshed",
      description: "News features are limited on this environment."
    });
  };

  const handleCreateMarket = (newsItem: any) => {
    createMarketMutation.mutate(newsItem);
  };

  const toggleCategory = (category: string) => {
    const isRemoving = selectedCategories.includes(category);
    setSelectedCategories(prev => 
      isRemoving 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    toast({
      title: isRemoving ? "Category removed" : "Category added",
      description: `${category} ${isRemoving ? "removed from" : "added to"} your filters`
    });
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim().toLowerCase();
    if (!trimmed) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }
    if (trimmed.length > 20) {
      toast({ title: "Category name too long (max 20 characters)", variant: "destructive" });
      return;
    }
    if ([...defaultCategories, ...customCategories].includes(trimmed)) {
      toast({ title: "Category already exists", variant: "destructive" });
      return;
    }
    
    setCustomCategories(prev => [...prev, trimmed]);
    setSelectedCategories(prev => [...prev, trimmed]);
    setNewCategory("");
    toast({ title: "Category added", description: `"${trimmed}" has been added to your categories` });
  };

  const handleRemoveCustomCategory = (category: string) => {
    setCustomCategories(prev => prev.filter(c => c !== category));
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  const handleAddRssSource = () => {
    const trimmed = rssUrl.trim();
    if (!trimmed) {
      toast({ title: "Please enter an RSS URL", variant: "destructive" });
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast({ title: "Invalid URL format", variant: "destructive" });
      return;
    }
    if (rssSources.includes(trimmed)) {
      toast({ title: "RSS source already added", variant: "destructive" });
      return;
    }
    
    setRssSources(prev => [...prev, trimmed]);
    setRssUrl("");
    toast({ title: "RSS source added", description: "News from this source will be included" });
  };

  const handleRemoveRssSource = (url: string) => {
    setRssSources(prev => prev.filter(u => u !== url));
  };

  const allCategories = [...defaultCategories, ...customCategories];
  const filteredNews = newsTopics.filter((news: any) => 
    selectedCategories.length === 0 || selectedCategories.includes(news.category)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            News-Based Market Creation
          </CardTitle>
          <CardDescription>
            Automatically discover trending news and create prediction markets from headlines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-create toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-base">Auto-create markets from headlines</Label>
                <p className="text-sm text-muted-foreground">
                  AI will automatically generate market questions from trending news
                </p>
              </div>
            </div>
            <Switch
              checked={autoCreateEnabled}
              onCheckedChange={setAutoCreateEnabled}
            />
          </div>

          {/* Category filters */}
          <div className="space-y-2">
            <Label>News Categories</Label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="capitalize"
                >
                  {category}
                  {customCategories.includes(category) && (
                    <X 
                      className="w-3 h-3 ml-1 hover:text-destructive" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomCategory(category);
                      }}
                    />
                  )}
                </Button>
              ))}
            </div>
            
            {/* Add custom category */}
            <div className="flex gap-2 mt-2">
              <Input 
                placeholder="Add custom category..." 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                maxLength={20}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={handleAddCategory}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* RSS/Custom sources */}
          <div className="space-y-2">
            <Label>Custom News Sources (RSS)</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="https://example.com/rss.xml" 
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRssSource()}
              />
              <Button variant="outline" onClick={handleAddRssSource}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {rssSources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {rssSources.map((url) => (
                  <Badge key={url} variant="secondary" className="flex items-center gap-1">
                    <span className="truncate max-w-[200px]">{new URL(url).hostname}</span>
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveRssSource(url)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trending News */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending News
              </CardTitle>
              <CardDescription>
                Click to create a prediction market from any headline
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No trending news available</p>
              <p className="text-sm">News topics will appear here when added to the system</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNews.map((news: any) => (
                <div 
                  key={news.id} 
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={categoryColors[news.category] || "bg-muted text-muted-foreground"}>
                          {news.category}
                        </Badge>
                        {news.source_name && (
                          <>
                            <span className="text-xs text-muted-foreground">{news.source_name}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                          </>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(news.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="font-medium mb-2">{news.headline}</h3>
                      
                      {news.suggested_market_title && (
                        <div className="p-3 rounded-md bg-muted/50 border border-dashed">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-xs font-medium text-primary">Suggested Market</span>
                          </div>
                          <p className="text-sm">{news.suggested_market_title}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleCreateMarket(news)}
                        disabled={createMarketMutation.isPending}
                      >
                        {createMarketMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-3 h-3 mr-1" />
                            Create
                          </>
                        )}
                      </Button>
                      {news.source_url && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-xs"
                          onClick={() => window.open(news.source_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Source
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-created markets */}
      {autoCreateEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Auto-Created Markets
            </CardTitle>
            <CardDescription>
              Markets automatically generated from news headlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No auto-created markets yet</p>
              <p className="text-sm">Markets will appear here when created from trending news</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};