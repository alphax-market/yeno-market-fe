import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { User } from 'lucide-react';
import { toast } from 'sonner';

export function TempLoginButton() {
  const { loginAsDevUser, isDevUser } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const handleLogin = async () => {
    if (isDevUser) return;
    setIsPending(true);
    try {
      await loginAsDevUser();
      toast.success('Logged in as Dev User. You can trade without connecting a wallet.');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Dev login failed');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/50 transition-colors text-sm font-medium"
    >
      <User className="w-4 h-4" />
      {isPending ? 'Logging in...' : 'Dev Login'}
    </button>
  );
}
