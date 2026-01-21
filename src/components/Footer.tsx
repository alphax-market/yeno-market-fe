import { Twitter, MessageCircle, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-background font-bold text-xs">YN</span>
            </div>
            <span className="text-xl font-bold gradient-text">YeNo</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <MessageCircle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <FileText className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </a>
          </div>
        </div>

        <div className="text-center mt-8 pt-8 border-t border-border/50 text-sm text-muted-foreground">
          © 2026 YeNo
        </div>
      </div>
    </footer>
  );
}
