'use client';

import { supabase } from '@meupersonal/supabase';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export interface Student {
  id: string;
  full_name: string;
  email: string;
  is_invite?: boolean;
}

export function useStudents() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };

    getUser();
  }, []);

  return useQuery({
    queryKey: ['students', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('coachings')
        .select(`
          client_id,
          profiles!client_id (
            id,
            full_name,
            email
          )
        `)
        .eq('professional_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      // Transform data to flat structure
      return (data || [])
        .map((item: any) => {
          if (!item.profiles) return null;
          return {
            id: item.profiles.id,
            full_name: item.profiles.full_name,
            email: item.profiles.email,
            is_invite: false,
          };
        })
        .filter(Boolean) as Student[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
