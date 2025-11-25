'use client';

import { useAssociateStudent, useCreateStudent, useFindStudentByCode, useProfessionalServices } from '@/shared/hooks/useStudents';
import { useEffect, useState } from 'react';

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateStudentModal({ isOpen, onClose }: CreateStudentModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(''); // Optional now
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<{ id: string; full_name: string } | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isPendingProfile, setIsPendingProfile] = useState(false);
  const [hasCode, setHasCode] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  
  const createStudent = useCreateStudent();
  const associateStudent = useAssociateStudent();
  const findStudent = useFindStudentByCode();
  const { data: fetchedServices = [] } = useProfessionalServices();
  
  // Fallback for development/testing if no services configured
  const availableServices = fetchedServices.length > 0 ? fetchedServices : ['training', 'nutrition'];

  // Auto-select service if only one is available
  useEffect(() => {
    if (availableServices.length === 1 && selectedServices.length === 0) {
      setSelectedServices([availableServices[0]]);
    }
  }, [availableServices, selectedServices.length]);

  if (!isOpen) return null;

  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode) return;

    try {
      const student = await findStudent.mutateAsync(searchCode);
      if (student) {
        setExistingProfile(student);
        setIsPendingProfile(true); // Assuming code search finds pending students mostly
      } else {
        alert('Aluno não encontrado com este código.');
      }
    } catch (error) {
      console.error('Error finding student:', error);
      alert('Erro ao buscar aluno.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      alert('Selecione pelo menos um serviço.');
      return;
    }

    try {
      const result = await createStudent.mutateAsync({ fullName, email, services: selectedServices });
      
      if (result.status === 'created' && result.data) {
        setInviteCode(result.data.invite_code);
      }
    } catch (error) {
      console.error('Error creating student:', error);
    }
  };

  const handleAssociate = async () => {
    if (!existingProfile) return;
    if (selectedServices.length === 0) {
      alert('Selecione pelo menos um serviço.');
      return;
    }

    try {
      await associateStudent.mutateAsync({ 
        studentId: existingProfile.id, 
        services: selectedServices,
        isPending: isPendingProfile 
      });
      handleClose();
    } catch (error) {
      console.error('Error associating student:', error);
    }
  };

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setInviteCode(null);
    setExistingProfile(null);
    setSelectedServices([]);
    setIsPendingProfile(false);
    setHasCode(false);
    setSearchCode('');
    createStudent.reset();
    associateStudent.reset();
    findStudent.reset();
    onClose();
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const serviceLabels: Record<string, string> = {
    training: 'Treinos',
    nutrition: 'Nutrição',
    physiotherapy: 'Fisioterapia',
    psychology: 'Psicologia'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl">
        {existingProfile ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Aluno Encontrado</h3>
              <p className="text-muted-foreground">
                Aluno: <strong>{existingProfile.full_name}</strong>
                <br />
                Deseja se associar a este aluno?
              </p>
            </div>

            {/* Service Selection for Association */}
            {availableServices.length > 1 && (
              <div className="text-left">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Serviços a oferecer:
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableServices.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        selectedServices.includes(service)
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {serviceLabels[service] || service}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setExistingProfile(null)}
                className="flex-1 py-3 bg-white/5 text-foreground font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssociate}
                disabled={associateStudent.isPending || selectedServices.length === 0}
                className="flex-1 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {associateStudent.isPending ? 'Associando...' : 'Associar'}
              </button>
            </div>
          </div>
        ) : inviteCode ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Aluno Cadastrado!</h3>
              <p className="text-muted-foreground">
                Envie o código abaixo para o aluno completar o cadastro no app.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <code className="text-2xl font-mono font-bold text-primary tracking-wider">
                {inviteCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Copiar código"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Concluir
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">
                {hasCode ? 'Associar Aluno' : 'Novo Aluno'}
              </h3>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Toggle between Create and Associate */}
            <div className="flex p-1 bg-white/5 rounded-lg mb-6">
              <button
                onClick={() => setHasCode(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  !hasCode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Criar Novo
              </button>
              <button
                onClick={() => setHasCode(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  hasCode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tenho Código
              </button>
            </div>

            {hasCode ? (
              <form onSubmit={handleSearchCode} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="searchCode" className="block text-sm font-medium text-foreground">
                    Código do Aluno
                  </label>
                  <input
                    id="searchCode"
                    type="text"
                    required
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase tracking-widest"
                    placeholder="EX: AB12CD"
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={findStudent.isPending}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {findStudent.isPending ? 'Buscando...' : 'Buscar Aluno'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                    Nome Completo
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email (Opcional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ex: joao@email.com"
                  />
                </div>

                {/* Service Selection for New Student */}
                {availableServices.length > 1 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Serviços a oferecer:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableServices.map(service => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                            selectedServices.includes(service)
                              ? 'bg-primary/20 text-primary border-primary/50'
                              : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {serviceLabels[service] || service}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createStudent.isPending || selectedServices.length === 0}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createStudent.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Criando...
                    </>
                  ) : (
                    'Criar Aluno'
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
