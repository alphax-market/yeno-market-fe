import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  XCircle,
  LogOut,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient, Market } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editMarket, setEditMarket] = useState<Market | null>(null);
  const [deleteMarket, setDeleteMarket] = useState<Market | null>(null);
  const [resolveMarket, setResolveMarket] = useState<Market | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: markets = [], isLoading } = useQuery({
    queryKey: ["admin", "markets", statusFilter],
    queryFn: () => apiClient.adminGetMarkets(statusFilter || undefined),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof apiClient.adminCreateMarket>[0]) =>
      apiClient.adminCreateMarket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "markets"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      setCreateOpen(false);
      toast({ title: "Market created" });
    },
    onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof apiClient.adminUpdateMarket>[1] }) =>
      apiClient.adminUpdateMarket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "markets"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      setEditMarket(null);
      toast({ title: "Market updated" });
    },
    onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, hard }: { id: string; hard: boolean }) =>
      apiClient.adminDeleteMarket(id, hard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "markets"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      setDeleteMarket(null);
      toast({ title: "Market deleted" });
    },
    onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminPauseMarket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "markets"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      toast({ title: "Trading paused" });
    },
    onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminActivateMarket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "markets"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      toast({ title: "Trading resumed" });
    },
    onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: "YES" | "NO" | "INVALID" }) =>
      apiClient.adminResolveMarket(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "markets"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      setResolveMarket(null);
      toast({ title: "Event closed" });
    },
    onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
  });

  const handleLogout = () => {
    apiClient.setAdminToken(null);
    navigate("/admin/login", { replace: true });
  };

  if (!apiClient.getAdminToken()) {
    navigate("/admin/login", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                View site
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground text-sm shrink-0">
              Manage markets. Changes sync to the main page in real time.
            </p>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add market
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground py-8">Loading…</p>
        ) : markets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No markets yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {markets.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{m.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="capitalize">{m.status.toLowerCase()}</span>
                    <span>{m.category}</span>
                    <span>{(Number(m.yesPrice) * 100).toFixed(0)}% Yes</span>
                    <span>${Number(m.volume).toLocaleString()} vol</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/market/${m.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditMarket(m)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {m.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => pauseMutation.mutate(m.id)}
                      disabled={pauseMutation.isPending}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  {m.status === "PAUSED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => activateMutation.mutate(m.id)}
                      disabled={activateMutation.isPending}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  {m.status === "ACTIVE" || m.status === "PAUSED" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setResolveMarket(m)}
                      title="Close event"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon" onClick={() => setDeleteMarket(m)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateMarketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(d) => createMutation.mutate(d)}
        loading={createMutation.isPending}
      />
      {editMarket && (
        <EditMarketDialog
          market={editMarket}
          onClose={() => setEditMarket(null)}
          onSubmit={(d) => updateMutation.mutate({ id: editMarket.id, data: d })}
          loading={updateMutation.isPending}
        />
      )}
      {deleteMarket && (
        <AlertDialog open={!!deleteMarket} onOpenChange={() => setDeleteMarket(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete market?</AlertDialogTitle>
              <AlertDialogDescription>
                "{deleteMarket.title}" will be marked cancelled (or permanently deleted if you choose hard delete).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate({ id: deleteMarket.id, hard: false })}
              >
                Soft delete
              </AlertDialogAction>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteMutation.mutate({ id: deleteMarket.id, hard: true })}
              >
                Hard delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {resolveMarket && (
        <ResolveDialog
          market={resolveMarket}
          onClose={() => setResolveMarket(null)}
          onResolve={(r) => resolveMutation.mutate({ id: resolveMarket.id, resolution: r })}
          loading={resolveMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateMarketDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (d: Parameters<typeof apiClient.adminCreateMarket>[0]) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [yesPrice, setYesPrice] = useState("0.5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseFloat(yesPrice);
    if (isNaN(y) || y < 0.01 || y > 0.99) return;
    onSubmit({
      title,
      description: description || undefined,
      category,
      endDate: new Date(endDate).toISOString(),
      yesPrice: y,
      noPrice: 1 - y,
    });
    setTitle("");
    setDescription("");
    setCategory("general");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add market</DialogTitle>
          <DialogDescription>Create a new prediction market event.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Yes price (0–1)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
                value={yesPrice}
                onChange={(e) => setYesPrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">End date</label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMarketDialog({
  market,
  onClose,
  onSubmit,
  loading,
}: {
  market: Market;
  onClose: () => void;
  onSubmit: (d: Parameters<typeof apiClient.adminUpdateMarket>[1]) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState(market.title);
  const [description, setDescription] = useState(market.description ?? "");
  const [category, setCategory] = useState(market.category);
  const [yesPrice, setYesPrice] = useState(String(market.yesPrice));
  const [endDate, setEndDate] = useState(market.endDate.slice(0, 16));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseFloat(yesPrice);
    if (isNaN(y) || y < 0.01 || y > 0.99) return;
    onSubmit({
      title,
      description: description || undefined,
      category,
      yesPrice: y,
      noPrice: 1 - y,
      endDate: new Date(endDate).toISOString(),
    });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit market</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Yes price</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
                value={yesPrice}
                onChange={(e) => setYesPrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">End date</label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({
  market,
  onClose,
  onResolve,
  loading,
}: {
  market: Market;
  onClose: () => void;
  onResolve: (r: "YES" | "NO" | "INVALID") => void;
  loading: boolean;
}) {
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close event</DialogTitle>
          <DialogDescription>
            Resolve "{market.title}" and close trading.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 py-4">
          <Button
            variant="outline"
            className="flex-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            onClick={() => onResolve("YES")}
            disabled={loading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Yes
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            onClick={() => onResolve("NO")}
            disabled={loading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            No
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve("INVALID")}
            disabled={loading}
          >
            Invalid
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
