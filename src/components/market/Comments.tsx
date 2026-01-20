import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/contexts/WalletContext";
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";

interface CommentsProps {
  marketId: string;
}

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  dislikes: number;
  replies: Comment[];
  position?: "yes" | "no";
}

// Mock comments data
const mockComments: Comment[] = [
  {
    id: "1",
    author: "CryptoTrader",
    content: "Looking at historical trends, this seems highly likely. I'm going all in on Yes.",
    timestamp: new Date(Date.now() - 3600000 * 2),
    likes: 24,
    dislikes: 3,
    position: "yes",
    replies: [
      {
        id: "1-1",
        author: "Skeptic101",
        content: "I wouldn't be so sure. The fundamentals don't support this prediction.",
        timestamp: new Date(Date.now() - 3600000),
        likes: 8,
        dislikes: 5,
        replies: [],
        position: "no",
      }
    ]
  },
  {
    id: "2",
    author: "AnalystPro",
    content: "Important to consider the external factors here. The timing is crucial and could swing either way.",
    timestamp: new Date(Date.now() - 7200000),
    likes: 45,
    dislikes: 2,
    replies: [],
  },
  {
    id: "3",
    author: "MarketWatcher",
    content: "Based on my research, the current odds seem about right. Not betting big on this one.",
    timestamp: new Date(Date.now() - 86400000),
    likes: 12,
    dislikes: 1,
    replies: [],
  }
];

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.avatar} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {comment.author.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author}</span>
            {comment.position && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                comment.position === "yes" 
                  ? "bg-success/20 text-success" 
                  : "bg-destructive/20 text-destructive"
              }`}>
                Holds {comment.position.toUpperCase()}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.timestamp)}</span>
          </div>
          
          <p className="text-sm text-foreground mb-2">{comment.content}</p>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setLiked(!liked); setDisliked(false); }}
              className={`flex items-center gap-1 text-xs ${liked ? 'text-success' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{comment.likes + (liked ? 1 : 0)}</span>
            </button>
            <button 
              onClick={() => { setDisliked(!disliked); setLiked(false); }}
              className={`flex items-center gap-1 text-xs ${disliked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{comment.dislikes + (disliked ? 1 : 0)}</span>
            </button>
            <button 
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </div>
          
          {showReply && (
            <div className="mt-3 flex gap-2">
              <Textarea 
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="text-sm min-h-[60px] bg-secondary"
              />
              <Button size="sm" variant="ghost" onClick={() => setShowReply(false)}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Comments({ marketId }: CommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { isConnected, user } = useWallet();
  const [comments] = useState<Comment[]>(mockComments);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    // Would submit to backend here
    console.log("Submitting comment:", newComment);
    setNewComment("");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Comments ({comments.length})
      </h3>
      
      {/* New Comment Input */}
      <div className="mb-6">
        {isConnected ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts on this market..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-secondary min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!newComment.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Connect your wallet to join the discussion
            </p>
            <Button variant="outline" size="sm">Connect Wallet</Button>
          </div>
        )}
      </div>
      
      {/* Comments List */}
      <div className="space-y-6">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
