
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { Project, ProjectLog } from '../types';

const ClientDashboard: React.FC = () => {
  const [view, setView] = useState<'overview' | 'history'>('overview');
  const [context, setContext] = useState<{ projects: Project[]; updates: ProjectLog[] }>({ projects: [], updates: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load client-specific data asynchronously
  useEffect(() => {
    async function loadData() {
      if (user?.clientId) {
        setLoading(true);
        try {
          const data = await db.getClientContext(user.clientId);
          setContext(data);
        } catch (error) {
          console.error("Error loading dashboard data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.clientId]);

  const SidebarContent = (
    <nav className="space-y-1">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Seu Portal</div>
      <button onClick={() => setView('overview')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium ${view === 'overview' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Visão Geral</span>
      </button>
      <button onClick={() => setView('history')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium ${view === 'history' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Histórico de Atualizações</span>
      </button>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 font-medium">Sincronizando portal...</div>;

  return (
    <Layout title="Tech Hub do Cliente" roleTag="Acesso Parceiro" sidebar={SidebarContent}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {view === 'overview' && (
            <>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800">Olá, {user?.name.split(' ')[0]}</h2>
                <p className="text-slate-500 mt-2">Acompanhe aqui o progresso em tempo real da nossa parceria.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {context.projects.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
                    <div className="mt-4 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">{p.status}</span>
                    </div>
                  </div>
                ))}
                {context.projects.length === 0 && <p className="text-slate-400 italic">Nenhum projeto ativo no momento.</p>}
              </div>
            </>
          )}

          {view === 'history' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Linha do Tempo de Entregas</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {context.updates.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic">Ainda não há atualizações públicas para este projeto.</div>
                ) : (
                  [...context.updates].reverse().map((l) => (
                    <div key={l.id} className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{l.title}</h4>
                        <span className="text-xs text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-500">{l.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <ChatPanel 
            type="client" 
            title="Intérprete de Status" 
            description="Entenda o progresso do seu projeto em linguagem clara." 
          />
        </div>
      </div>
    </Layout>
  );
};

export default ClientDashboard;
