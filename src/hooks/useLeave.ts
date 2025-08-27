// hooks/useLeave.ts
import { useState, useEffect } from 'react';
import { ILeave, ILeaveBalance } from '@/types/leave';

export const useLeave = () => {
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [balance, setBalance] = useState<ILeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaves = async (filters?: any) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters || {});
      const response = await fetch(`/api/employee/leave/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch leaves');
      }

      setLeaves(data.data.leaves);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (year?: number) => {
    try {
      const currentYear = year || new Date().getFullYear();
      const response = await fetch(`/api/employee/leave/balance?year=${currentYear}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch balance');
      }

      setBalance(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    }
  };

  const cancelLeave = async (leaveId: string) => {
    try {
      const response = await fetch(`/api/employee/leave/${leaveId}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel leave');
      }

      // Refresh leaves after cancellation
      fetchLeaves();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel leave');
      return false;
    }
  };

  const applyLeave = async (leaveData: any) => {
    try {
      const response = await fetch('/api/employee/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to apply for leave');
      }

      // Refresh leaves and balance after application
      fetchLeaves();
      fetchBalance();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply for leave');
      return false;
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchBalance();
  }, []);

  return {
    leaves,
    balance,
    loading,
    error,
    fetchLeaves,
    fetchBalance,
    cancelLeave,
    applyLeave,
    setError
  };
};