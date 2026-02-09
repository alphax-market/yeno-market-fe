import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Twitter, Zap, Eye, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { z } from "zod";

// Validation constants matching database constraints
const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;
const LIQUIDITY_MIN = 0;
const LIQUIDITY_MAX = 100000;

const VALID_CATEGORIES = ["crypto", "politics", "sports", "entertainment", "technology", "finance", "science", "general", "news"] as const;

// Zod schema for market validation
const marketSchema = z.object({
  title: z.string()
    .min(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`)
    .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`),
  description: z.string()
    .max(DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
    .optional()
    .or(z.literal("")),
  category: z.enum(VALID_CATEGORIES, { errorMap: () => ({ message: "Invalid category" }) }),
  endDate: z.date({ required_error: "End date is required" })
    .refine((date) => date > new Date(), { message: "End date must be in the future" }),
  initialLiquidity: z.number()
    .min(LIQUIDITY_MIN, `Liquidity must be at least ${LIQUIDITY_MIN}`)
    .max(LIQUIDITY_MAX, `Liquidity must be at most ${LIQUIDITY_MAX}`),
});
interface CreateMarketFormProps {
  onSuccess?: () => void;
}

const categories = [
  { value: "crypto", label: "Crypto" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "science", label: "Science" },
  { value: "general", label: "General" }
];

export const CreateMarketForm = ({ onSuccess }: CreateMarketFormProps) => {
  const { toast } = useToast();
  const { user } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    endDate: undefined as Date | undefined,
    initialLiquidity: 100,
    twitterEmbed: false,
    autoPost: false
  });

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to create a market",
        variant: "destructive"
      });
      return;
    }

    // Validate with zod schema
    const validationResult = marketSchema.safeParse({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      endDate: formData.endDate,
      initialLiquidity: formData.initialLiquidity,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation error",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Market creation is not available on this environment (no Supabase).
      toast({
        title: "Not available",
        description: "Market creation is not available on this environment. Use the API-backed markets on the homepage.",
        variant: "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Error creating market",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Create New Market
          </CardTitle>
          <CardDescription>
            Set up a new prediction market for your audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Market Question *</Label>
              <Input
                id="title"
                placeholder="Will Bitcoin reach $100k by March 2025?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Make it a clear yes/no question that can be objectively resolved
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide additional context, resolution criteria, and sources..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            {/* Category & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Initial Liquidity */}
            <div className="space-y-2">
              <Label htmlFor="liquidity">Initial Liquidity ($)</Label>
              <Input
                id="liquidity"
                type="number"
                min={10}
                step={10}
                value={formData.initialLiquidity}
                onChange={(e) => setFormData({ ...formData, initialLiquidity: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Higher liquidity means better prices and more trading activity
              </p>
            </div>

            {/* Twitter Integration */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <span className="font-medium">Twitter Integration</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twitter-embed">Enable embed voting</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow users to vote directly from Twitter
                  </p>
                </div>
                <Switch
                  id="twitter-embed"
                  checked={formData.twitterEmbed}
                  onCheckedChange={(checked) => setFormData({ ...formData, twitterEmbed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-post">Auto-post updates</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically post price changes and resolution
                  </p>
                </div>
                <Switch
                  id="auto-post"
                  checked={formData.autoPost}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoPost: checked })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any, true);
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Zap className="w-4 h-4 mr-2" />
                Publish Market
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border bg-card">
            <Badge variant="secondary" className="mb-2">
              {categories.find(c => c.value === formData.category)?.label || "General"}
            </Badge>
            <h3 className="font-semibold mb-2">
              {formData.title || "Your market question will appear here"}
            </h3>
            {formData.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {formData.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-green-500">$0.50</div>
                <div className="text-xs text-muted-foreground">Yes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-500">$0.50</div>
                <div className="text-xs text-muted-foreground">No</div>
              </div>
            </div>
          </div>

          {formData.twitterEmbed && (
            <div className="p-3 rounded-lg border border-[#1DA1F2]/30 bg-[#1DA1F2]/5">
              <div className="flex items-center gap-2 text-sm">
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <span>Twitter embed enabled</span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">
                  You'll earn <span className="font-medium text-foreground">5%</span> of all trading fees on this market
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
