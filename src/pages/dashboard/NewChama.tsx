'use client';

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NewChama() {
  const navigate = useNavigate();

  const handleCreate = useCallback(() => navigate('/dashboard/groups', { replace: true }), [navigate]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="cc-h1">Create a New Chama</h1>
      <p className="mt-2 text-sm text-muted-foreground">This is your entry page for creating a chama group.</p>
      <div className="mt-6 cc-card p-6">
        <p className="text-sm mb-3">Go to Groups page to create and manage chamas. Use new fields to include location, profession and local community criteria.</p>
        <Button onClick={handleCreate}>Open Groups</Button>
      </div>
    </div>
  );
}
