import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  MoreHorizontal, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  Twitter,
  Eye,
  Edit,
  Trash2,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: Edit },
  active: { label: "Active", variant: "default" as const, icon: Play },
  paused: { label: "Paused", variant: "outline" as const, icon: Pause },
  resolved: { label: "Resolved", variant: "secondary" as const, icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle }
};

export const MarketManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useWallet();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingMarket, setEditingMarket] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });

  // Creator markets not available on this environment (no Supabase)
  const { data: markets = [], isLoading } = useQuery({
    queryKey: ["creator-markets", user?.id],
    queryFn: async () => [],
    enabled: !!user?.id
  });

  // Update market status mutation (no-op: no Supabase)
  const updateStatusMutation = useMutation({
    mutationFn: async (_: { id: string; status: "active" | "paused" | "draft" | "resolved" | "cancelled" }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-markets"] });
      toast({ title: "Market updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating market", description: error.message, variant: "destructive" });
    }
  });

  // Update market details mutation (no-op: no Supabase)
  const updateMarketMutation = useMutation({
    mutationFn: async (_: { id: string; title: string; description: string }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-markets"] });
      toast({ title: "Market updated successfully" });
      setEditingMarket(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating market", description: error.message, variant: "destructive" });
    }
  });

  // Delete market mutation (no-op: no Supabase)
  const deleteMarketMutation = useMutation({
    mutationFn: async (_id: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-markets"] });
      toast({ title: "Market deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting market", description: error.message, variant: "destructive" });
    }
  });

  const handleViewDetails = (marketId: string) => {
    navigate(`/market/${marketId}`);
  };

  const handleEditMarket = (market: any) => {
    setEditingMarket(market);
    setEditFormData({ title: market.title, description: market.description || "" });
  };

  const handleSaveEdit = () => {
    if (editingMarket) {
      updateMarketMutation.mutate({
        id: editingMarket.id,
        title: editFormData.title,
        description: editFormData.description
      });
    }
  };

  const handlePauseMarket = (marketId: string) => {
    updateStatusMutation.mutate({ id: marketId, status: "paused" });
  };

  const handleResumeMarket = (marketId: string) => {
    updateStatusMutation.mutate({ id: marketId, status: "active" });
  };

  const handlePublishMarket = (marketId: string) => {
    updateStatusMutation.mutate({ id: marketId, status: "active" });
  };

  const handleShareOnTwitter = (market: any) => {
    const text = encodeURIComponent(`Check out this prediction market: "${market.title}"`);
    const url = encodeURIComponent(`${window.location.origin}/market/${market.id}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleResolveMarket = (_marketId: string, _resolution: "yes" | "no") => {
    toast({ title: "Not available", description: "Creator features are not available on this environment.", variant: "destructive" });
  };

  const handleDeleteMarket = (marketId: string) => {
    deleteMarketMutation.mutate(marketId);
  };

  const filteredMarkets = markets.filter((market: any) => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || market.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Your Markets</CardTitle>
          <CardDescription>Manage and monitor all your prediction markets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "draft", "paused", "resolved"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Markets Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Market</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Yes Price</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading markets...
                    </TableCell>
                  </TableRow>
                ) : filteredMarkets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No markets found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMarkets.map((market: any) => {
                    const StatusIcon = statusConfig[market.status as keyof typeof statusConfig]?.icon || Edit;
                    return (
                      <TableRow key={market.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium line-clamp-1">{market.title}</span>
                            {market.twitter_embed_enabled && (
                              <Twitter className="w-3 h-3 text-[#1DA1F2]" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[market.status as keyof typeof statusConfig]?.variant || "secondary"}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[market.status as keyof typeof statusConfig]?.label || market.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={market.yes_price > 0.5 ? "text-green-500" : market.yes_price < 0.5 ? "text-red-500" : ""}>
                            {formatPrice(market.yes_price)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(market.volume || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            0
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(market.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(market.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditMarket(market)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Market
                              </DropdownMenuItem>
                              {market.status === "active" && (
                                <DropdownMenuItem onClick={() => handlePauseMarket(market.id)}>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause Market
                                </DropdownMenuItem>
                              )}
                              {market.status === "paused" && (
                                <DropdownMenuItem onClick={() => handleResumeMarket(market.id)}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume Market
                                </DropdownMenuItem>
                              )}
                              {market.status === "draft" && (
                                <DropdownMenuItem onClick={() => handlePublishMarket(market.id)}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Publish Market
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleShareOnTwitter(market)}>
                                <Twitter className="w-4 h-4 mr-2" />
                                Share on Twitter
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {market.status === "active" && (
                                <DropdownMenuItem onClick={() => handleResolveMarket(market.id, "yes")}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Resolve Market
                                </DropdownMenuItem>
                              )}
                              {market.status === "draft" && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteMarket(market.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Market
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Market Dialog */}
      <Dialog open={!!editingMarket} onOpenChange={(open) => !open && setEditingMarket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Market</DialogTitle>
            <DialogDescription>Update the market details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMarket(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateMarketMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
