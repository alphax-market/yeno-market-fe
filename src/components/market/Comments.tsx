import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/contexts/WalletContext";
import { useComments, useCreateComment } from "@/hooks/useMarkets";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import type { MarketComment } from "@/lib/api";

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
  const author = comment.user?.displayName ?? comment.user?.id?.slice(0, 8) ?? "Anonymous";

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={comment.user?.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {author.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm">{author}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
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

  const { data, isLoading, error } = useComments(marketId);
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
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Comments {isApi && !error ? `(${comments.length})` : ""}
      </h3>

      {/* New Comment Input */}
      <div className="mb-6">
        {isConnected && isApi ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts on this market..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-secondary min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim() || createComment.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {createComment.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
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

      {/* Comments List */}
      <div className="space-y-6">
        {!isApi ? (
          <p className="text-sm text-muted-foreground py-4">Comments are available for live markets.</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading comments...</p>
        ) : error ? (
          <p className="text-sm text-destructive py-4">Failed to load comments.</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
