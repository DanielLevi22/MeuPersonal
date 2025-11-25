'use client';

import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 -right-48 w-96 h-96 bg-yellow-500/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative max-w-md w-full mx-4 text-center">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Aguardando Aprovação
          </h1>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              Sua conta de profissional foi criada com sucesso e está em análise.
            </p>
            <p>
              Para garantir a qualidade da nossa plataforma, todos os cadastros de profissionais passam por uma verificação manual.
            </p>
            <p className="text-sm bg-white/5 p-4 rounded-lg border border-white/5">
              Você receberá um email assim que seu acesso for liberado.
            </p>
          </div>

          <div className="pt-6">
            <Link 
              href="/auth/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
