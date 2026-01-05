
import React, { useState, useEffect, useMemo } from 'react';
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

  return (
    <div className="flex flex-col items-center justify-center p-2 group">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100/30" />
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${getColor(safeValue)} transition-all duration-1000 ease-out`} />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-black text-2xl tracking-tighter text-white`}>
          {safeValue}
        </div>
      </div>
      <span className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
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
  }, [user?.clientId, activeTab]);

  const rankInfo = useMemo(() => {
    const count = context.projects.length;
    if (count >= 11) return { medal: '💎', label: 'DIAMANTE', msg: 'Você é um pilar do nosso ecossistema!' };
    if (count >= 6) return { medal: '🥇', label: 'OURO', msg: 'Sua visão tecnológica é inspiradora!' };
    if (count >= 3) return { medal: '🥈', label: 'PRATA', msg: 'Estamos acelerando sua transformação!' };
    return { medal: '🥉', label: 'BRONZE', msg: 'O começo de uma grande jornada digital!' };
  }, [context.projects]);

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

  const SidebarContent = (
    <nav className="space-y-6">
      <div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">Pipeline</div>
        <div className="space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('monitor')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${activeTab === 'monitor' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>Monitor ao Vivo</button>
          <button onClick={() => setActiveTab('requests')} className={`w-full text-left px-4 py-3.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${activeTab === 'requests' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>Solicitações</button>
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

  return (
    <Layout title="Portal de Transparência" roleTag="Área do Parceiro" sidebar={SidebarContent}>
      
      {activeTab === 'overview' && selectedProject && (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
             <div>
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Conselho Estratégico de Engenharia</p>
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{selectedProject.name}</h1>
             </div>
             
             <div className="bg-slate-900 px-8 py-5 rounded-[32px] border border-slate-800 shadow-2xl flex items-center space-x-6">
                <div className="text-4xl">{rankInfo.medal}</div>
                <div>
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Selo Parceiro {rankInfo.label}</p>
                   <p className="text-[11px] font-bold text-slate-400 italic">"{rankInfo.msg}"</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div className="bg-slate-950 rounded-[48px] p-16 shadow-2xl border border-slate-900">
                 <h3 className="text-2xl font-black text-white tracking-tight mb-16 flex items-center uppercase text-sm">
                   Project Vitals 
                   <span className="ml-4 px-2 py-0.5 bg-slate-800 text-slate-400 text-[8px] font-black rounded uppercase">Live Data</span>
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.performance} label="Performance" />
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.accessibility} label="Acessibilidade" />
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.bestPractices} label="Boas Práticas" />
                   <LighthouseGauge value={selectedProject.lighthouseMetrics?.seo} label="SEO" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Especificações Técnicas</h4>
                    <div className="flex flex-wrap gap-2">
                       {selectedProject.stack.split(',').map((s, i) => (
                         <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-700">{s.trim()}</span>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Cronograma & Tipo</h4>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Categoria</p>
                          <p className="text-sm font-black text-slate-900">{selectedProject.projectType || 'SISTEMA WEB'}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Início</p>
                             <p className="text-sm font-black text-slate-900">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Previsão</p>
                             <p className="text-sm font-black text-slate-900">{selectedProject.expectedEndDate ? new Date(selectedProject.expectedEndDate).toLocaleDateString() : 'INDETERMINADO'}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-sm leading-relaxed">
                 <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedProject.description}</ReactMarkdown>
                 </div>
              </div>
            </div>

            <div className="space-y-10">
               <ChatPanel type="client" title="Status Interpreter" description="Análise de Contexto IA" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitor' && selectedProject && (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in">
           <div className="bg-slate-950 rounded-[48px] p-16 text-white border border-slate-900 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
              <div>
                 <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest mb-4">Monitoramento de Fluxo</p>
                 <h2 className="text-4xl font-black">{selectedProject.name}</h2>
              </div>
              <div className="flex space-x-4">
                 <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center">
                    <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Status Global</p>
                    <p className="text-emerald-500 font-black">ESTÁVEL</p>
                 </div>
                 <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center">
                    <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Versão Hub</p>
                    <p className="text-blue-500 font-black">v3.2.0</p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-2xl h-[700px] relative group">
              <div className="absolute top-0 left-0 right-0 h-12 bg-slate-100 border-b flex items-center px-6 space-x-2 z-10">
                 <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                 </div>
                 <div className="flex-1 max-w-md mx-auto bg-white rounded-lg px-4 py-1 text-[10px] font-bold text-slate-400 truncate text-center">
                    {selectedProject.productionUrl || 'Servidor Interno'}
                 </div>
              </div>
              {selectedProject.productionUrl ? (
                <iframe 
                  src={selectedProject.productionUrl} 
                  className="w-full h-full pt-12 border-none"
                  title="Live Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center pt-12 bg-slate-50">
                   <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                   </div>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Visualização Indisponível</p>
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
                <p className="text-slate-400 font-medium mt-2">Você ainda não abriu chamados técnicos para este projeto.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                {context.requests.map(r => (
                  <div key={r.id} className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                     <div className="flex justify-between items-start mb-8">
                        <span className={`px-6 py-2.5 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] border ${
                           r.status === RequestStatus.DONE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{r.status}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</span>
                     </div>
                     <h4 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors tracking-tighter">{r.title}</h4>
                     <p className="text-slate-500 font-bold mb-8 leading-relaxed text-lg">{r.description}</p>
                     
                     {r.adminComment && (
                       <div className="mt-auto pt-8 border-t border-slate-100">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center">
                             <span className="mr-2">💬</span> Resposta do Hub
                          </p>
                          <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 text-slate-700 font-medium text-sm leading-relaxed">
                             {r.adminComment}
                          </div>
                       </div>
                     )}
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
                <input name="title" className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-xl outline-none" placeholder="Assunto Principal" required />
                <select name="type" className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-lg outline-none">
                   <option value="BUG">Relatar Inconsistência</option>
                   <option value="IMPROVEMENT">Sugestão de UX/UI</option>
                   <option value="NEW_FEATURE">Nova Funcionalidade</option>
                </select>
                <textarea name="description" className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[28px] h-48 font-bold text-lg outline-none resize-none" placeholder="Descreva os detalhes aqui..." required></textarea>
                <div className="flex space-x-6 pt-10">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-5 font-black text-slate-400">Abortar</button>
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl shadow-blue-500/30">Enviar Ticket</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ClientDashboard;
