'use client';

import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Bem-vindo, {user?.email || 'Profissional'}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total de Alunos</h3>
          <p className="text-4xl font-bold text-green-500">0</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Treinos Criados</h3>
          <p className="text-4xl font-bold text-blue-500">0</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Dietas Ativas</h3>
          <p className="text-4xl font-bold text-orange-500">0</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Próximos Passos</h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Configurar seu perfil profissional</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Adicionar seus primeiros alunos</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Criar treinos personalizados</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
