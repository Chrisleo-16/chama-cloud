'use client';

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi, contributionsApi, userApi } from '@/lib/api';
import { Loader2, Users, Target, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { formatKES } from './Overview';
import { useToast } from '@/hooks/use-toast';

export default function GroupDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const groupId = Number(params.id || 0);

  const { data: group, isLoading: gL } = useQuery({ queryKey: ['group', groupId], queryFn: () => groupsApi.get(groupId), enabled: !!groupId });
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: userApi.getProfile });
  const { data: contributions } = useQuery({ queryKey: ['contributions'], queryFn: contributionsApi.list });

  const myContributions = useMemo(() =>
    (contributions || []).filter((c) => c.group === groupId && profile?.id && c.merchant && +c.merchant === +profile.id),
    [contributions, groupId, profile?.id]
  );

  const joinMut = useMutation({
    mutationFn: () => groupsApi.join(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({ title: 'Joined group!', description: `You joined ${group?.name}` });
    },
    onError: () => toast({ title: 'Could not join', variant: 'destructive' }),
  });

  if (gL || !group) return <div className="flex items-center justify-center h-80"><Loader2 className="w-8 h-8 text-[var(--brand-light)] cc-spin" /></div>;

  const progress = Math.min(100, Math.round(parseFloat(group.progress_percentage || '0')));

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="cc-h1">{group.name}</h1>
          <p className="text-sm text-[var(--fg-muted)]">{group.description || 'No description yet'}</p>
        </div>
        <p className="text-xs text-[var(--fg-muted)]">Group ID {group.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cc-card">
          <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider mb-2">Group summary</p>
          <p><strong>Wholesaler</strong>: {group.wholesaler_name || 'Unassigned'}</p>
          <p><strong>Location</strong>: {group.description?.split(',').find(c => c.toLowerCase().includes('location')) || 'N/A'}</p>
          <p><strong>Progress</strong>: {progress}%</p>
          <div className="cc-progress my-2"><div className="cc-progress-bar" style={{ width: `${progress}%` }} /></div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/dashboard/payments?groupId=' + groupId)} className="cc-btn-primary flex-1">Contribute</button>
            <button onClick={() => joinMut.mutate()} className="cc-btn-outline flex-1">Join group</button>
          </div>
        </div>

        <div className="cc-card">
          <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider mb-2">Expected supply</p>
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4" /><span>Next shipment in 4 days</span></div>
          <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4" /><span>Delivery point: {group.business_address || 'Main depot'}</span></div>
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /><span>Quality check scheduled</span></div>
        </div>
      </div>

      <div className="cc-card">
        <h2 className="font-semibold mb-3">Your contribution history</h2>
        {myContributions.length === 0 ? (
          <p className="text-[var(--fg-muted)]">No contributions yet in this group. Use the Contribute button above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="cc-table w-full">
              <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {myContributions.map(c => (
                  <tr key={c.id}><td>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-KE') : '-'}</td><td>{formatKES(parseFloat(c.amount))}</td><td>{c.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/dashboard/groups')} className="cc-btn-outline">Back to Groups</button>
    </div>
  );
}
