
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { Project, ProjectLog, ProjectStatus, LogType } from '../types';

const ClientDashboard: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [context, setContext] = useState<{ projects: Project[]; updates: ProjectLog[] }>({ projects: [], updates: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (user?.clientId) {
        setLoading(true);
        try {
          const data = await db.getClientContext(user.clientId);
          setContext(data);
          if (data.projects.length > 0 && !selectedProject) {
            setSelectedProject(data.projects[0]);
          }
        } catch (error) {
          console.error("Erro ao carregar portal do cliente:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.clientId]);

  const getStatusStep = (status: ProjectStatus) => {
    const steps = [
      { id: 'conception', label: 'Concepção', statuses: [ProjectStatus.IDEA] },
      { id: 'development', label: 'Engenharia', statuses: [ProjectStatus.DEVELOPMENT] },
      { id: 'testing', label: 'Validação (QA)', statuses: [ProjectStatus.TESTING, ProjectStatus.PAUSED] },
      { id: 'production', label: 'Lançamento', statuses: [ProjectStatus.PRODUCTION, ProjectStatus.MAINTENANCE, ProjectStatus.FINISHED] }
    ];
    const currentStepIndex = steps.findIndex(s => s.statuses.includes(status));
    return { steps, currentStepIndex };
  };

  const SidebarContent = (
    <nav className="space-y-6">
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Meus Projetos</div>
        <div className="space-y-1">
          {context.projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all group ${
                selectedProject?.id === p.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <p className="text-sm font-bold truncate">{p.name}</p>
              <p className={`text-[10px] uppercase tracking-tighter mt-0.5 ${selectedProject?.id === p.id ? 'text-blue-100' : 'text-slate-500'}`}>
                {p.status}
              </p>
            </button>
          ))}
        </div>
      </div>
      
      <div className="pt-6 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Suporte Direto</p>
          <p className="text-xs text-slate-300">Precisa de ajuda imediata?</p>
          <a href={`mailto:suporte@techhub.com`} className="text-xs text-blue-400 font-bold mt-1 block hover:underline">Abrir Chamado Técnico</a>
        </div>
      </div>
    </nav>
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium tracking-tight">Carregando seu ecossistema digital...</p>
    </div>
  );

  const { steps, currentStepIndex } = selectedProject ? getStatusStep(selectedProject.status) : { steps: [], currentStepIndex: -1 };

  return (
    <Layout title="Portal de Transparência" roleTag="Área do Parceiro" sidebar={SidebarContent}>
      {selectedProject ? (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Header do Projeto */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                    {selectedProject.projectType}
                 </span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedProject.name}</h2>
              <p className="text-slate-500 mt-4 leading-relaxed max-w-2xl">{selectedProject.description}</p>
              
              {/* Stepper de Progresso Premium */}
              <div className="mt-12">
                <div className="relative flex justify-between">
                  {/* Linha de fundo */}
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                  {/* Linha de progresso ativa */}
                  <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-1000"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                  ></div>

                  {steps.map((step, idx) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 transition-all duration-500 ${
                        idx <= currentStepIndex 
                        ? 'bg-blue-600 border-white ring-4 ring-blue-50' 
                        : 'bg-white border-slate-200'
                      }`}></div>
                      <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${
                        idx <= currentStepIndex ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Links e Acessos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {selectedProject.productionUrl && (
                 <a href={selectedProject.productionUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all shadow-xl shadow-slate-200/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ambiente Live</p>
                        <p className="text-white font-bold">Acessar Produção</p>
                      </div>
                    </div>
                    <svg className="text-slate-600 group-hover:text-blue-400 transition-colors" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                 </a>
               )}
               {selectedProject.stagingUrl && (
                 <a href={selectedProject.stagingUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500/50 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Homologação</p>
                        <p className="text-slate-900 font-bold">Review Interno</p>
                      </div>
                    </div>
                    <svg className="text-slate-300 group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                 </a>
               )}
            </div>

            {/* Linha do Tempo Executiva */}
            <div className="space-y-6">
               <h3 className="text-lg font-bold text-slate-800 flex items-center">
                 <svg className="mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M12 8V2M5 12h14"/></svg>
                 Histórico de Entregas
               </h3>
               <div className="space-y-4">
                  {context.updates.filter(u => u.projectId === selectedProject.id).length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
                      <p className="text-slate-400 italic">Nenhuma atualização registrada para este projeto ainda.</p>
                    </div>
                  ) : (
                    context.updates.filter(u => u.projectId === selectedProject.id).map((update, idx) => (
                      <div key={update.id} className={`bg-white p-6 rounded-2xl border transition-all ${update.logType === LogType.MILESTONE ? 'border-purple-200 shadow-md ring-1 ring-purple-50' : 'border-slate-100 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center space-x-3">
                              <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded ${
                                update.logType === LogType.MILESTONE ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {update.logType === LogType.MILESTONE ? 'Marco Atingido' : 'Atualização de Rotina'}
                              </span>
                              <h4 className="font-bold text-slate-800">{update.title}</h4>
                           </div>
                           <span className="text-[10px] font-medium text-slate-400">{new Date(update.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{update.description}</p>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* Coluna Lateral IA */}
          <div className="space-y-6">
             <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Previsão de Entrega</p>
                <p className="text-2xl font-bold">{selectedProject.expectedEndDate ? new Date(selectedProject.expectedEndDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                   <span className="text-xs opacity-80">Tech Stack:</span>
                   <span className="text-xs font-bold">{selectedProject.stack || 'Standard'}</span>
                </div>
             </div>
             
             <ChatPanel 
               type="client" 
               title="Status Interpreter" 
               description="IA treinada para traduzir o progresso técnico para você." 
             />
          </div>

        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
           <div className="bg-slate-200 w-24 h-24 rounded-full flex items-center justify-center mb-6">
              <svg className="text-slate-400" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
           </div>
           <h2 className="text-xl font-bold text-slate-800">Selecione um projeto para começar</h2>
           <p className="text-slate-500 mt-2 max-w-sm">Use o menu lateral para alternar entre seus empreendimentos ativos e acompanhar o progresso.</p>
        </div>
      )}
    </Layout>
  );
};

export default ClientDashboard;
