import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient, Market } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useMarkets";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE_MB = 10;

async function uploadImageToS3(
  file: File,
  getUploadUrl: (filename: string, contentType: string) => Promise<{ uploadUrl: string; publicUrl: string }>
): Promise<string> {
  const { uploadUrl, publicUrl } = await getUploadUrl(file.name, file.type);
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error("Upload failed");
  return publicUrl;
}

/** Format a Date for datetime-local input (local time) */
function toLocalDatetimeInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

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
        <AlertDialog open={!!deleteMarket} onOpenChange={(open) => !open && setDeleteMarket(null)}>
          <AlertDialogContent aria-describedby="delete-market-desc">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete market?</AlertDialogTitle>
              <AlertDialogDescription id="delete-market-desc">
                &quot;{deleteMarket.title}&quot; will be removed from the public list (marked cancelled in the database). It will no longer appear in events.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate({ id: deleteMarket.id, hard: false })}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
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
  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData ?? [];
  const categoryOptions = Array.from(
    new Set(["general", ...apiCategories.map((c: { category: string }) => c.category)])
  );

  const CRICKET_TOPICS = ["T20 World Cup", "IPL", "Test Series", "ODI", "Ashes", "World Test Championship", "Bilateral Series"];
  const FOOTBALL_TOPICS = ["La Liga", "English Premier League", "Serie A", "Bundesliga", "Ligue 1", "Champions League", "Europa League", "FIFA World Cup"];
  const presetTopics = useMemo(() => [...CRICKET_TOPICS, ...FOOTBALL_TOPICS], []);
  const apiTopics = useMemo(() => {
    const all = (apiCategories as { topics?: string[] }[]).flatMap((c) => c.topics ?? []);
    const set = new Set(presetTopics);
    return Array.from(new Set(all)).filter((t) => !set.has(t)).sort();
  }, [apiCategories, presetTopics]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [topicSelect, setTopicSelect] = useState<string>("__none__");
  const [customTopic, setCustomTopic] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [eventType, setEventType] = useState<"binary" | "multi">("binary");
  const [outcomes, setOutcomes] = useState<{ name: string; price?: number }[]>([{ name: "" }, { name: "" }]);
  const [startDate, setStartDate] = useState(() => toLocalDatetimeInputValue(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return toLocalDatetimeInputValue(d);
  });
  const [yesPrice, setYesPrice] = useState("0.5");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const { toast } = useToast();

  const effectiveCategory = category === "custom" ? customCategory.trim() || "general" : category;

  const addOutcome = () => setOutcomes((prev) => [...prev, { name: "" }]);
  const removeOutcome = (i: number) => setOutcomes((prev) => prev.filter((_, idx) => idx !== i));
  const setOutcomeName = (i: number, name: string) =>
    setOutcomes((prev) => prev.map((o, idx) => (idx === i ? { ...o, name } : o)));
  const setOutcomePrice = (i: number, price: string) =>
    setOutcomes((prev) => prev.map((o, idx) => (idx === i ? { ...o, price: parseFloat(price) || undefined } : o)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventType === "binary") {
      const y = parseFloat(yesPrice);
      if (isNaN(y) || y < 0.01 || y > 0.99) return;
      onSubmit({
        title,
        description: description || undefined,
        category: effectiveCategory,
        topic: topicSelect === "__none__" ? undefined : topicSelect === "__custom__" ? (customTopic.trim() || undefined) : topicSelect,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: new Date(endDate).toISOString(),
        yesPrice: y,
        noPrice: 1 - y,
        imageUrl: imageUrl.trim() || undefined,
      });
    } else {
      const validOutcomes = outcomes.filter((o) => o.name.trim());
      if (validOutcomes.length < 2) return;
      onSubmit({
        title,
        description: description || undefined,
        category: effectiveCategory,
        topic: topicSelect === "__none__" ? undefined : topicSelect === "__custom__" ? (customTopic.trim() || undefined) : topicSelect,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: new Date(endDate).toISOString(),
        outcomes: validOutcomes.map((o) => ({ name: o.name.trim(), price: o.price })),
        imageUrl: imageUrl.trim() || undefined,
      });
    }
    setTitle("");
    setDescription("");
    setCategory("general");
    setTopicSelect("__none__");
    setCustomTopic("");
    setCustomCategory("");
    setEventType("binary");
    setOutcomes([{ name: "" }, { name: "" }]);
    setYesPrice("0.5");
    setStartDate(toLocalDatetimeInputValue(new Date()));
    setImageUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add market</DialogTitle>
          <DialogDescription>Create a new prediction market event.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Event type</label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as "binary" | "multi")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binary">Binary (Yes/No)</SelectItem>
                <SelectItem value="multi">Multiple outcomes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={category === "custom" ? "custom" : category}
              onValueChange={(v) => setCategory(v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom (type below)</SelectItem>
              </SelectContent>
            </Select>
            {category === "custom" && (
              <Input
                placeholder="Enter category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Topic (optional)</label>
            <Select value={topicSelect} onValueChange={(v) => setTopicSelect(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select or use custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {CRICKET_TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {FOOTBALL_TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {apiTopics.length > 0 && (
                  <>
                    {apiTopics.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="__custom__">Custom (type below)</SelectItem>
              </SelectContent>
            </Select>
            {topicSelect === "__custom__" && (
              <Input
                placeholder="e.g. SA20, Pro League"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="mt-2"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">Presets, existing topics, or custom. Reused topics appear in the list.</p>
          </div>
          {eventType === "binary" && (
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
          )}
          {eventType === "multi" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Outcomes</label>
                <Button type="button" variant="outline" size="sm" onClick={addOutcome}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2 mt-1">
                {outcomes.map((o, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Outcome name"
                      value={o.name}
                      onChange={(e) => setOutcomeName(i, e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="Price"
                      value={o.price ?? ""}
                      onChange={(e) => setOutcomePrice(i, e.target.value)}
                      className="w-24"
                    />
                    {outcomes.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOutcome(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Add at least 2 outcomes. Price is optional (0–1).</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Start date & time</label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">When the market goes live (cricket/football). Optional; if empty, creation time is used.</p>
          </div>
          <div>
            <label className="text-sm font-medium">End date & time</label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Shown in your local time. Default: 7 days from now, 11:59 PM.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Image (optional)</label>
            <div className="mt-1 space-y-2">
              {imageUrl ? (
                <div className="flex items-center gap-2">
                  <img src={imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl("")}
                    disabled={imageUploading}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    className="max-w-xs"
                    disabled={imageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                        toast({ title: "Invalid type", description: "Use JPEG, PNG, GIF or WebP.", variant: "destructive" });
                        return;
                      }
                      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                        toast({ title: "File too large", description: `Max ${MAX_IMAGE_SIZE_MB} MB.`, variant: "destructive" });
                        return;
                      }
                      setImageUploading(true);
                      try {
                        const url = await uploadImageToS3(file, (fn, ct) => apiClient.adminGetUploadUrl(fn, ct));
                        setImageUrl(url);
                        toast({ title: "Image uploaded" });
                      } catch (err) {
                        toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                      } finally {
                        setImageUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  {imageUploading && <span className="text-sm text-muted-foreground">Uploading…</span>}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF or WebP. Max {MAX_IMAGE_SIZE_MB} MB.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !title.trim() ||
                (eventType === "binary" && (isNaN(parseFloat(yesPrice)) || parseFloat(yesPrice) < 0.01 || parseFloat(yesPrice) > 0.99)) ||
                (eventType === "multi" && outcomes.filter((o) => o.name.trim()).length < 2)
              }
            >
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
  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData ?? [];
  const categoryOptions = Array.from(
    new Set(["general", ...apiCategories.map((c: { category: string }) => c.category)])
  );

  const EDIT_CRICKET_TOPICS = ["T20 World Cup", "IPL", "Test Series", "ODI", "Ashes", "World Test Championship", "Bilateral Series"];
  const EDIT_FOOTBALL_TOPICS = ["La Liga", "English Premier League", "Serie A", "Bundesliga", "Ligue 1", "Champions League", "Europa League", "FIFA World Cup"];
  const editPresetTopics = useMemo(() => [...EDIT_CRICKET_TOPICS, ...EDIT_FOOTBALL_TOPICS], []);
  const editApiTopics = useMemo(() => {
    const all = (apiCategories as { topics?: string[] }[]).flatMap((c) => c.topics ?? []);
    const set = new Set(editPresetTopics);
    return Array.from(new Set(all)).filter((t) => !set.has(t)).sort();
  }, [apiCategories, editPresetTopics]);

  const marketTopic = (market as { topic?: string }).topic ?? null;
  const [title, setTitle] = useState(market.title);
  const [description, setDescription] = useState(market.description ?? "");
  const [category, setCategory] = useState(market.category);
  const [topicSelect, setTopicSelect] = useState<string>(() => {
    if (!marketTopic) return "__none__";
    if (editPresetTopics.includes(marketTopic)) return marketTopic;
    return "__custom__";
  });
  const [customTopic, setCustomTopic] = useState(() => (marketTopic && !editPresetTopics.includes(marketTopic) ? marketTopic : ""));
  const [customCategory, setCustomCategory] = useState("");
  const [yesPrice, setYesPrice] = useState(String(market.yesPrice));
  const [startDate, setStartDate] = useState(() =>
    market.startDate ? toLocalDatetimeInputValue(new Date(market.startDate)) : ""
  );
  const [endDate, setEndDate] = useState(() =>
    toLocalDatetimeInputValue(new Date(market.endDate))
  );
  const [imageUrl, setImageUrl] = useState(market.imageUrl ?? "");
  const [imageUploading, setImageUploading] = useState(false);
  const { toast } = useToast();
  const [outcomes, setOutcomes] = useState<{ name: string; price?: number }[]>(
    market.outcomes?.length ? market.outcomes : [{ name: "" }, { name: "" }]
  );
  const isMultiOutcome = (market.outcomes?.length ?? 0) >= 2;

  useEffect(() => {
    if (categoryOptions.length && !categoryOptions.includes(market.category)) {
      setCategory("custom");
      setCustomCategory(market.category);
    }
  }, [categoryOptions.length, market.category]);

  const effectiveCategory = category === "custom" ? customCategory.trim() || market.category : category;

  const addOutcome = () => setOutcomes((prev) => [...prev, { name: "" }]);
  const removeOutcome = (i: number) => setOutcomes((prev) => prev.filter((_, idx) => idx !== i));
  const setOutcomeName = (i: number, name: string) =>
    setOutcomes((prev) => prev.map((o, idx) => (idx === i ? { ...o, name } : o)));
  const setOutcomePrice = (i: number, price: string) =>
    setOutcomes((prev) => prev.map((o, idx) => (idx === i ? { ...o, price: parseFloat(price) || undefined } : o)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Parameters<typeof apiClient.adminUpdateMarket>[1] = {
      title,
      description: description || undefined,
      category: effectiveCategory,
      topic: topicSelect === "__none__" ? undefined : topicSelect === "__custom__" ? (customTopic.trim() || undefined) : topicSelect,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: new Date(endDate).toISOString(),
      imageUrl: imageUrl.trim() || undefined,
    };
    if (isMultiOutcome) {
      const validOutcomes = outcomes.filter((o) => o.name.trim());
      if (validOutcomes.length >= 2) payload.outcomes = validOutcomes.map((o) => ({ name: o.name.trim(), price: o.price }));
    } else {
      const y = parseFloat(yesPrice);
      if (!isNaN(y) && y >= 0.01 && y <= 0.99) {
        payload.yesPrice = y;
        payload.noPrice = 1 - y;
      }
    }
    onSubmit(payload);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={categoryOptions.includes(category) ? category : "custom"}
              onValueChange={(v) => setCategory(v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom (type below)</SelectItem>
              </SelectContent>
            </Select>
            {category === "custom" && (
              <Input
                placeholder="Enter category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Topic (optional)</label>
            <Select value={topicSelect} onValueChange={(v) => setTopicSelect(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select or use custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {EDIT_CRICKET_TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {EDIT_FOOTBALL_TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {editApiTopics.length > 0 &&
                  editApiTopics.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                <SelectItem value="__custom__">Custom (type below)</SelectItem>
              </SelectContent>
            </Select>
            {topicSelect === "__custom__" && (
              <Input
                placeholder="e.g. SA20, Pro League"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          {isMultiOutcome ? (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Outcomes</label>
                <Button type="button" variant="outline" size="sm" onClick={addOutcome}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2 mt-1">
                {outcomes.map((o, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Outcome name"
                      value={o.name}
                      onChange={(e) => setOutcomeName(i, e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="Price"
                      value={o.price ?? ""}
                      onChange={(e) => setOutcomePrice(i, e.target.value)}
                      className="w-24"
                    />
                    {outcomes.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOutcome(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
          )}
          <div>
            <label className="text-sm font-medium">Start date & time</label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">When the market goes live (cricket/football). Optional.</p>
          </div>
          <div>
            <label className="text-sm font-medium">End date & time</label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Image (optional)</label>
            <div className="mt-1 space-y-2">
              {imageUrl ? (
                <div className="flex items-center gap-2">
                  <img src={imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl("")}
                    disabled={imageUploading}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    className="max-w-xs"
                    disabled={imageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                        toast({ title: "Invalid type", description: "Use JPEG, PNG, GIF or WebP.", variant: "destructive" });
                        return;
                      }
                      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                        toast({ title: "File too large", description: `Max ${MAX_IMAGE_SIZE_MB} MB.`, variant: "destructive" });
                        return;
                      }
                      setImageUploading(true);
                      try {
                        const url = await uploadImageToS3(file, (fn, ct) => apiClient.adminGetUploadUrl(fn, ct));
                        setImageUrl(url);
                        toast({ title: "Image uploaded" });
                      } catch (err) {
                        toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                      } finally {
                        setImageUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  {imageUploading && <span className="text-sm text-muted-foreground">Uploading…</span>}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF or WebP. Max {MAX_IMAGE_SIZE_MB} MB.</p>
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
