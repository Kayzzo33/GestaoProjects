
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { Project, ProjectLog, ProjectStatus, LogType, ChangeRequest, RequestStatus } from '../types';

const LighthouseGauge = ({ value, label }: { value: number | undefined; label: string }) => {
  const safeValue = value ?? 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;
  
  const getColor = (v: number) => {
    if (v >= 90) return 'stroke-emerald-500';
    if (v >= 50) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  const getTextColor = (v: number) => {
    if (v >= 90) return 'text-emerald-500';
    if (v >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 group">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100/30" />
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${getColor(safeValue)} transition-all duration-1000 ease-out`} />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-black text-3xl tracking-tighter ${getTextColor(safeValue)}`}>
          {safeValue}
        </div>
      </div>
      <span className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center group-hover:text-slate-300 transition-colors">{label}</span>
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monitor' | 'requests'>('overview');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [context, setContext] = useState<{ projects: Project[]; requests: ChangeRequest[] }>({ projects: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
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
          console.error("Erro ao carregar portal:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [user?.clientId]);

  const handleNewRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.clientId || !selectedProject) return;
    const formData = new FormData(e.currentTarget);
    await db.addChangeRequest({
      projectId: selectedProject.id,
      clientId: user.clientId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as any,
      status: RequestStatus.OPEN
    });
    setShowRequestModal(false);
    const data = await db.getClientContext(user.clientId);
    setContext(data);
  };

  const getStatusStep = (status: ProjectStatus) => {
    const steps = [
      { id: 'conception', label: 'Concepção', statuses: [ProjectStatus.IDEA] },
      { id: 'development', label: 'Engenharia', statuses: [ProjectStatus.DEVELOPMENT] },
      { id: 'testing', label: 'Validação', statuses: [ProjectStatus.TESTING, ProjectStatus.PAUSED] },
      { id: 'production', label: 'Lançamento', statuses: [ProjectStatus.PRODUCTION, ProjectStatus.MAINTENANCE, ProjectStatus.FINISHED] }
    ];
    const currentStepIndex = steps.findIndex(s => s.statuses.includes(status));
    return { steps, currentStepIndex };
  };

  const SidebarContent = (
    <nav className="space-y-6">
      <div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">Pipeline</div>
        <div className="space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('monitor')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${activeTab === 'monitor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>Monitor ao Vivo</button>
          <button onClick={() => setActiveTab('requests')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${activeTab === 'requests' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-900'}`}>Solicitações</button>
        </div>
      </div>
      <div className="pt-6 border-t border-slate-900">
         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">Meus Ecossistemas</div>
         <div className="space-y-1">
          {context.projects.map((p) => (
            <button key={p.id} onClick={() => setSelectedProject(p)} className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-black ${selectedProject?.id === p.id ? 'text-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 font-black text-white uppercase text-xs tracking-[0.5em] animate-pulse">Iniciando Portal...</div>;

  const { steps, currentStepIndex } = selectedProject ? getStatusStep(selectedProject.status) : { steps: [], currentStepIndex: -1 };

  return (
    <Layout title="Portal de Transparência" roleTag="Área do Parceiro" sidebar={SidebarContent}>
      
      {activeTab === 'overview' && selectedProject && (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
             <div>
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Conselho Estratégico de Engenharia</p>
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{selectedProject.name}</h1>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saúde Operacional</p>
                  <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Ativo em Produção</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div className="bg-white rounded-[48px] p-16 border border-slate-200 shadow-sm relative overflow-x-auto">
                <h3 className="text-xl font-black text-slate-900 mb-12 flex items-center tracking-tight">
                   <div className="w-3 h-3 bg-blue-600 rounded-full mr-4 shadow-lg shadow-blue-500/50"></div>
                   Status da Jornada
                </h3>
                <div className="relative flex justify-between px-10 min-w-[700px]">
                  <div className="absolute top-[20px] left-10 right-10 h-2 bg-slate-50 rounded-full z-0"></div>
                  <div className="absolute top-[20px] left-10 h-2 bg-blue-600 rounded-full z-0 transition-all duration-1000 shadow-lg shadow-blue-500/30" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
                  
                  {steps.map((step, idx) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                      <div className={`w-11 h-11 rounded-full border-4 transition-all duration-700 flex items-center justify-center shadow-lg ${
                        idx < currentStepIndex ? 'bg-blue-600 border-white text-white' : 
                        idx === currentStepIndex ? 'bg-white border-blue-600 text-blue-600 scale-125' : 
                        'bg-white border-slate-100 text-slate-300'
                      }`}>
                        {idx < currentStepIndex ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6 9 17l-5-5"/></svg> : <span className="font-black text-sm">{idx + 1}</span>}
                      </div>
                      <span className={`mt-8 text-[10px] font-black uppercase tracking-widest ${idx <= currentStepIndex ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 rounded-[48px] p-20 shadow-2xl border border-slate-900 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[120px]"></div>
                 <h3 className="text-2xl font-black text-white tracking-tight mb-16 flex items-center">
                   Project Vitals 
                   <span className="ml-4 px-2 py-0.5 bg-slate-800 text-slate-400 text-[8px] font-black rounded uppercase">Lighthouse Core</span>
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.performance} label="Performance" />
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.accessibility} label="Acessibilidade" />
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.bestPractices} label="Melhores Práticas" />
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.seo} label="SEO" />
                 </div>
              </div>

              <div className="bg-white rounded-[40px] p-16 border border-slate-200 shadow-sm leading-relaxed">
                 <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedProject.description}</ReactMarkdown>
                 </div>
              </div>
            </div>

            <div className="space-y-10">
               <ChatPanel type="client" title="Status Interpreter" description="Análise de Contexto Facilitada" />
               <div className="bg-slate-100 rounded-[40px] p-10 border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-8">Arquitetura Técnica</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.stack.split(',').map(s => (
                      <span key={s} className="px-5 py-3 bg-white text-slate-700 font-black text-[10px] rounded-xl border border-slate-200 uppercase tracking-widest shadow-sm">{s.trim()}</span>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitor' && selectedProject && (
        <div className="h-[calc(100vh-14rem)] flex flex-col space-y-8 animate-in slide-in-from-right-12 duration-700">
           <div className="flex justify-between items-center px-4">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Monitor de Produção</h2>
                <p className="text-slate-500 font-bold mt-2">Observabilidade direta do ambiente estável.</p>
              </div>
              <a href={selectedProject.productionUrl} target="_blank" className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xs hover:bg-black transition-all shadow-xl flex items-center space-x-3">
                 <span>ACESSAR EXTERNO</span>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
           </div>
           <div className="flex-1 bg-white rounded-[56px] border-[16px] border-slate-100 shadow-2xl overflow-hidden relative">
              {selectedProject.productionUrl ? (
                <iframe src={selectedProject.productionUrl} className="w-full h-full border-none" title="Live Preview" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 px-20 text-center">
                  <p className="font-black uppercase tracking-[0.2em] text-sm mb-4">Aguardando sinal de produção</p>
                  <p className="text-xs font-bold text-slate-400">O link de monitoramento será habilitado assim que o sistema for publicado no ambiente final.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <div className="flex justify-between items-center px-4">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Tickets e Suporte</h2>
             <button onClick={() => setShowRequestModal(true)} className="bg-blue-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Abrir Solicitação</button>
           </div>
           {context.requests.length === 0 ? (
             <div className="bg-white rounded-[48px] p-32 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center mx-4">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Nenhuma solicitação ativa</h3>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                {context.requests.map(r => (
                  <div key={r.id} className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                     <div className="flex justify-between items-start mb-10">
                        <span className={`px-6 py-2.5 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] border shadow-sm ${
                          r.status === RequestStatus.OPEN ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>{r.status}</span>
                     </div>
                     <h4 className="text-3xl font-black text-slate-900 mb-6 group-hover:text-blue-600 transition-colors tracking-tighter">{r.title}</h4>
                     <p className="text-slate-500 font-bold mb-10 leading-relaxed text-lg">{r.description}</p>
                     <div className="mt-auto pt-8 border-t border-slate-50">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Protocolo: {r.id}</p>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[48px] w-full max-w-lg p-16 shadow-2xl animate-in zoom-in duration-300">
             <h3 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter">Novo Chamado Técnico</h3>
             <form onSubmit={handleNewRequest} className="space-y-6">
                <input name="title" className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-xl outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="Assunto Principal" required />
                <select name="type" className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-lg outline-none">
                   <option value="BUG">Relatar Inconsistência</option>
                   <option value="IMPROVEMENT">Sugestão de UX/UI</option>
                   <option value="NEW_FEATURE">Nova Funcionalidade</option>
                </select>
                <textarea name="description" className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[28px] h-48 font-bold text-lg outline-none resize-none" placeholder="Descreva os detalhes aqui..." required></textarea>
                <div className="flex space-x-6 pt-10">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 transition-colors">Abortar</button>
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">Enviar Ticket</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ClientDashboard;
