
import React from 'react';
import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';

const PendingActivationPage: React.FC = () => {
  const { user, firebaseUser, logout, loading } = useAuth();

  if (loading) return null;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
      <div className="bg-amber-500/10 p-4 rounded-full mb-6 border border-amber-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-2">Acesso Pendente de Configuração</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Você se autenticou com sucesso, mas o seu perfil ainda não foi vinculado a um cargo (Admin ou Cliente) no banco de dados Firestore.
      </p>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg mb-8 text-left">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Seu ID Único (UID)</label>
        <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded-xl border border-slate-700">
          <code className="text-blue-400 font-mono text-sm break-all flex-1">{firebaseUser.uid}</code>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(firebaseUser.uid);
              alert("UID copiado!");
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
          <strong>O que fazer agora?</strong><br />
          1. Copie o UID acima.<br />
          2. Vá ao Firebase Console -&gt; Firestore.<br />
          3. Na coleção <code className="text-slate-300">users</code>, crie um documento com o ID sendo este UID.<br />
          4. Defina o campo <code className="text-slate-300">role</code> como <code className="text-slate-300">ADMIN</code>.
        </p>
      </div>

      <button 
        onClick={logout}
        className="text-slate-400 hover:text-white text-sm font-medium underline underline-offset-4"
      >
        Sair e tentar outro e-mail
      </button>
    </div>
  );
};

export default PendingActivationPage;
