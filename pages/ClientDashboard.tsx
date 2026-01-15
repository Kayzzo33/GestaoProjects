
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { Project, ProjectLog, ProjectStatus, LogType, ChangeRequest, RequestStatus, Client } from '../types';

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
  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100/30" />
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${getColor(safeValue)} transition-all duration-1000 ease-out`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-black text-2xl tracking-tighter text-white">
          {safeValue}
        </div>
      </div>
      <span className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monitor' | 'requests'>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [context, setContext] = useState<{ projects: Project[]; requests: ChangeRequest[]; clientInfo?: Client }>({ projects: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (user?.clientId) {
        setLoading(true);
        const data = await db.getClientContext(user.clientId);
        const allClients = await db.getClients();
        const clientInfo = allClients.find(c => c.id === user.clientId);
        setContext({ ...data, clientInfo });
        if (data.projects.length > 0 && !selectedProjectId) setSelectedProjectId(data.projects[0].id);
        setLoading(false);
      }
    }
    loadData();
  }, [user?.clientId]);

  const selectedProject = useMemo(() => context.projects.find(p => p.id === selectedProjectId) || context.projects[0], [context.projects, selectedProjectId]);

  const strategicOpportunity = useMemo(() => {
    if (!selectedProject) return { title: 'Analisando Mercado...', msg: 'Estamos coletando dados estratégicos.' };
    const m = selectedProject.lighthouseMetrics;
    if (!m) return { title: 'Métricas Pendentes', msg: 'Estamos processando os dados vitais do seu projeto.' };
    
    if (m.performance < 90) return { title: 'Aceleração de Resposta', msg: 'Notei que a performance pode subir. Vamos otimizar o carregamento para aumentar sua retenção em 15%?' };
    if (m.seo < 90) return { title: 'Visibilidade Ativa', msg: 'Sua pontuação de SEO tem espaço para crescer. Podemos subir sua posição nos buscadores com novos metadados.' };
    return { title: 'Inteligência Artificial', msg: 'Seu ecossistema está no topo. Que tal integrar um assistente de IA personalizado para automatizar seu atendimento?' };
  }, [selectedProject]);

  const SidebarContent = (
    <nav className="space-y-6">
      <div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">Pipeline Ativo</div>
        <div className="space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>Painel de Valor</button>
          <button onClick={() => setActiveTab('monitor')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'monitor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>Visão ao Vivo</button>
          <button onClick={() => setActiveTab('requests')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>Suporte Técnico</button>
        </div>
      </div>
      <div className="pt-6 border-t border-slate-900">
         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">Meus Ecossistemas</div>
         {context.projects.map(p => (
           <button key={p.id} onClick={() => setSelectedProjectId(p.id)} className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-black ${selectedProjectId === p.id ? 'text-blue-500 bg-blue-500/5 border-l-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
             {p.name}
           </button>
         ))}
      </div>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 font-black text-white animate-pulse">Sincronizando Ecossistema...</div>;

  return (
    <Layout title="Portal do Parceiro" roleTag="Visão Estratégica" sidebar={SidebarContent}>
      {activeTab === 'overview' && selectedProject && (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
              <div>
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Inteligência de Mercado Ativa</p>
                 <h1 className="text-6xl font-black text-slate-900 tracking-tighter">{selectedProject.name}</h1>
                 {context.clientInfo?.isVip && (
                   <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-full shadow-lg border border-amber-300">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">VIP PARTNER HUB</span>
                   </div>
                 )}
              </div>
              <div className="bg-slate-950 p-8 rounded-[40px] shadow-2xl border border-slate-900 flex items-center space-x-6">
                 <div className="text-4xl">🚀</div>
                 <div>
                    <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest">Aceleração de Valor</p>
                    <p className="text-slate-400 font-bold text-xs italic">"Transformando código em ativos de negócio."</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                 <div className="bg-slate-950 rounded-[48px] p-16 shadow-2xl border border-slate-900">
                    <h3 className="text-white font-black uppercase text-xs tracking-widest mb-16">Saúde Vital do Ecossistema Digital</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                       <LighthouseGauge value={selectedProject.lighthouseMetrics?.performance} label="Performance" />
                       <LighthouseGauge value={selectedProject.lighthouseMetrics?.accessibility} label="Acessibilidade" />
                       <LighthouseGauge value={selectedProject.lighthouseMetrics?.bestPractices} label="Arquitetura" />
                       <LighthouseGauge value={selectedProject.lighthouseMetrics?.seo} label="SEO" />
                    </div>
                 </div>

                 <div className="bg-white p-12 rounded-[56px] border shadow-sm leading-relaxed">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Roadmap de Entrega de Valor</h4>
                    <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium whitespace-pre-wrap">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedProject.description}</ReactMarkdown>
                    </div>
                 </div>
              </div>
              <div className="space-y-10">
                 <ChatPanel type="client" title="IA Business Partner" description="Como podemos escalar hoje?" />
                 <div className="bg-blue-600 p-10 rounded-[48px] text-white shadow-2xl shadow-blue-500/20">
                    <h4 className="font-black text-xl mb-4 tracking-tight">{strategicOpportunity.title}</h4>
                    <p className="text-blue-100 font-medium text-sm mb-6 leading-relaxed">"{strategicOpportunity.msg}"</p>
                    <button onClick={() => setActiveTab('requests')} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Explorar Novas Features</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'monitor' && selectedProject && (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in h-full">
           <div className="bg-slate-950 rounded-[48px] p-16 text-white border border-slate-900 flex flex-col md:flex-row justify-between items-center mb-10">
              <div>
                 <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest mb-4">Visão em Tempo Real</p>
                 <h2 className="text-4xl font-black">{selectedProject.name}</h2>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center">
                 <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Status do Ecossistema</p>
                 <p className="text-emerald-500 font-black">ESTÁVEL E ONLINE</p>
              </div>
           </div>
           <div className="bg-white rounded-[48px] border-2 border-slate-100 overflow-hidden shadow-2xl h-[700px] relative">
              <div className="absolute top-0 left-0 right-0 h-10 bg-slate-50 border-b flex items-center px-4 space-x-2 z-10">
                 <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              {selectedProject.productionUrl ? (
                <iframe src={selectedProject.productionUrl} className="w-full h-full pt-10 border-none" title="Live Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center pt-10 bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-xs">
                   Nenhum URL de produção configurado para este projeto.
                </div>
              )}
           </div>
        </div>
      )}
      
      {activeTab === 'requests' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <div className="flex justify-between items-center px-4">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Tickets e Roadmaps</h2>
             <button className="bg-blue-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Abrir Solicitação</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
              {context.requests.filter(r => r.projectId === selectedProjectId).map(r => (
                <div key={r.id} className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm flex flex-col group hover:shadow-2xl transition-all">
                   <div className="flex justify-between items-start mb-8">
                      <span className={`px-6 py-2.5 text-[10px] font-black rounded-2xl uppercase tracking-widest border ${
                         r.status === RequestStatus.DONE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>{r.status}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</span>
                   </div>
                   <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">{r.title}</h4>
                   <p className="text-slate-500 font-bold mb-8 leading-relaxed text-lg">{r.description}</p>
                   {r.adminComment && (
                     <div className="mt-auto pt-8 border-t border-slate-100">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">💬 Resposta do Hub</p>
                        <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 text-slate-700 font-medium text-sm">
                           {r.adminComment}
                        </div>
                     </div>
                   )}
                </div>
              ))}
              {context.requests.filter(r => r.projectId === selectedProjectId).length === 0 && (
                <div className="col-span-full py-40 text-center">
                   <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">Sem chamados técnicos para este projeto.</p>
                </div>
              )}
           </div>
        </div>
      )}
    </Layout>
  );
};

export default ClientDashboard;
