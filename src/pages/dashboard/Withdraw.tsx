'use client';

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Withdraw() {
  const navigate = useNavigate();
  const handleGoBack = useCallback(() => navigate('/dashboard', { replace: true }), [navigate]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="cc-h1">Withdraw Funds</h1>
      <p className="mt-2 text-sm text-muted-foreground">Withdraw from your wallet.</p>
      <div className="mt-6 cc-card p-6">
        <p className="text-sm">This is a placeholder page. Add bank or M-Pesa withdrawal form and confirmation flow here.</p>
      </div>
      <Button className="mt-4" onClick={handleGoBack}>Back to Dashboard</Button>
    </div>
  );
}
