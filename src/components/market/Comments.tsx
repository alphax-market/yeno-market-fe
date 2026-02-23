import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/contexts/WalletContext";
import { useComments, useCreateComment } from "@/hooks/useMarkets";
import { MoreHorizontal, Heart, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { MarketComment } from "@/lib/api";
// import EmptyImage from "@/assets/png/empty-part.png";
import EmptyImage from "@/assets/svg/empty-part.svg?react";

interface CommentsProps {
  marketId: string;
}

const isApiMarketId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function CommentItem({
  comment,
  depth = 0,
}: {
  comment: MarketComment & { replies?: MarketComment[]; totalReplies?: number };
  depth?: number;
}) {
  const [liked, setLiked] = useState(false);
  const author = comment.user?.displayName ?? comment.user?.id?.slice(0, 8) ?? "Anonymous";

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0 border border-border">
          <AvatarImage src={comment.user?.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {author.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground text-sm shrink-0">{author}</span>
            <span className="inline-flex items-center rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success shrink-0">
              Yes —
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatTimeAgo(comment.createdAt)}
            </span>
            <span className="flex-1 min-w-2" />
            <button
              type="button"
              className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
          <button
            type="button"
            onClick={() => setLiked((prev) => !prev)}
            className="flex items-center gap-1 mt-1.5 text-muted-foreground hover:text-muted-foreground/80"
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-red-500 stroke-red-500" : ""}`}
            />
            <span className="text-xs">{liked ? 1 : 0}</span>
          </button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Comments({ marketId }: CommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { isConnected, connect } = useWallet();
  const isApi = isApiMarketId(marketId);

  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useComments(marketId);
  const createComment = useCreateComment(marketId);

  const comments = data?.pages?.flatMap((p) => p.comments) ?? [];

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment.mutateAsync({ content: newComment.trim() });
      setNewComment("");
      toast.success("Comment posted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post comment");
    }
  };

  return (
    <div className="w-full ">
      {/* Comment input */}
      <div className="mb-4">
        {isConnected && isApi ? (
            <div className="relative min-h-[80px] rounded-lg border border-border bg-background">
              <Textarea
                placeholder="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none rounded-lg border-0  pr-20 pb-12 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="absolute bottom-2 right-2">
                {/* <Button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || createComment.isPending}
                  size="sm"
                  className="rounded-lg bg-primary text-primary-foreground  hover:bg-foreground/90"
                > */}
                  <Button variant="default"
                  onClick={handleSubmit}
                  disabled={createComment.isPending}
                  size="sm"
                  className="rounded-lg bg-primary text-primary-foreground  hover:bg-foreground/90">
                  {createComment.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {!isApi
                  ? "Comments are available for live markets."
                  : "Connect your wallet or use Dev Login to join the discussion"}
              </p>
              {!isConnected && (
                <Button variant="outline" size="sm" onClick={() => connect()}>
                  Connect Wallet
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="border-b border-border" />

        {/* Comments list or empty state - only when authenticated */}
        <div className="pt-4">
          {!isApi ? (
            <p className="text-sm text-muted-foreground py-6">Comments are available for live markets.</p>
          ) : !isConnected ? (
            <p className="text-sm text-muted-foreground py-8">Connect your wallet to view comments.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground py-8">Loading comments...</p>
          ) : error ? (
            <p className="text-sm text-destructive py-8">Failed to load comments.</p>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2">
              <EmptyImage className=""/>
              <p className="text-xl font-semibold text-foreground mt-6">No Comments</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {comments.map((comment) => (
                  <div key={comment.id} className="py-4 first:pt-0">
                    <CommentItem comment={comment} />
                  </div>
                ))}
              </div>
              {hasNextPage && (
                <div className="flex justify-center pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="inline-flex items-center gap-1 text-foreground font-medium hover:underline"
                  >
                    View More
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}
