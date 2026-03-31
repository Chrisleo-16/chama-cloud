'use client';

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Deposit() {
  const navigate = useNavigate();

  const handleGoBack = useCallback(() => navigate('/dashboard', { replace: true }), [navigate]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="cc-h1">Deposit Funds</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use this page to deposit money to your wallet and chama groups.</p>
      <div className="mt-6 cc-card p-6">
        <p className="text-sm">For now, this is a placeholder page. You can integrate mobile money or bank payment forms here.</p>
        <p className="text-xs text-muted-foreground mt-2">Remaining work: add deposit flow with payments API and transactions history.</p>
      </div>
      <Button className="mt-4" onClick={handleGoBack}>Back to Dashboard</Button>
    </div>
  );
}
