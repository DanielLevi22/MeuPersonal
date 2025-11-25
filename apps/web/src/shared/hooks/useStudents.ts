'use client';

import { supabase } from '@meupersonal/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export interface Student {
  id: string;
  full_name: string;
  email: string;
  is_invite?: boolean;
  invite_code?: string;
  status?: 'active' | 'pending';
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

      // Fetch active students (linked profiles)
      const { data: activeData, error: activeError } = await supabase
        .from('students_personals')
        .select(`
          student_id,
          profiles!students_personals_student_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('personal_id', userId)
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Fetch pending students (from students table)
      const { data: pendingData, error: pendingError } = await supabase
        .from('students')
        .select('id, full_name, email, invite_code')
        .eq('personal_id', userId)
        .not('invite_code', 'is', null);

      if (pendingError) throw pendingError;

      const activeStudents = (activeData || [])
        .map((item: any) => {
          if (!item.profiles) return null;
          return {
            id: item.profiles.id,
            full_name: item.profiles.full_name,
            email: item.profiles.email,
            is_invite: false,
            status: 'active',
          };
        })
        .filter(Boolean) as Student[];

      const pendingStudents = (pendingData || []).map((item: any) => ({
        id: item.id,
        full_name: item.full_name,
        email: item.email,
        is_invite: true,
        invite_code: item.invite_code,
        status: 'pending',
      })) as Student[];

      return [...activeStudents, ...pendingStudents];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProfessionalServices() {
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
    queryKey: ['professional_services', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('professional_services')
        .select('service_category')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data.map(item => item.service_category);
    },
    enabled: !!userId,
  });
}

export function useFindStudentByCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, email')
        .eq('invite_code', code.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        throw error;
      }
      return data;
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fullName, email, services }: { fullName: string; email?: string; services: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Generate random 6-char invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create student in students table
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          full_name: fullName,
          email: email, // Optional now
          personal_id: user.id,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Create relationships for selected services
      if (services.length > 0) {
        const relationships = services.map(service => ({
          pending_client_id: student.id,
          professional_id: user.id,
          service_category: service,
          relationship_status: 'active',
          invited_by: user.id,
        }));

        const { error: relError } = await supabase
          .from('client_professional_relationships')
          .insert(relationships);

        if (relError) throw relError;
      }

      return { status: 'created', data: student };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useAssociateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, services, isPending }: { studentId: string; services: string[]; isPending?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (services.length === 0) return;

      const relationships = services.map(service => ({
        [isPending ? 'pending_client_id' : 'client_id']: studentId,
        professional_id: user.id,
        service_category: service,
        relationship_status: 'active',
      }));

      const { error } = await supabase
        .from('client_professional_relationships')
        .insert(relationships);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}


