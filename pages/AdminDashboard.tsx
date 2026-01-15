
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { geminiService } from '../geminiService';
import { ProjectStatus, Project, Client, ProjectLog, User, UserRole, AuditLog, LogType, ChangeRequest, RequestStatus, Lead, LeadStatus } from '../types';

const LighthouseGauge = ({ value, label }: { value: number | undefined; label: string }) => {
  const safeValue = value ?? 0;
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;
  const getColor = (v: number) => {
    if (v >= 90) return 'stroke-emerald-500';
    if (v >= 50) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${getColor(safeValue)} transition-all duration-1000`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">{safeValue}</span>
      </div>
      <span className="mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">{label}</span>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [view, setView] = useState<'overview' | 'projects' | 'project-detail' | 'clients' | 'client-detail' | 'users' | 'audit' | 'requests' | 'crm' | 'briefing'>('overview');
  const [showModal, setShowModal] = useState<'project' | 'edit-project' | 'client' | 'log' | 'user' | 'lead' | 'auth-profile' | null>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingResult, setBriefingResult] = useState<any>(null);
  const [suggestingResponse, setSuggestingResponse] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c, l, u, a, r, ld] = await Promise.all([
        db.getProjects(), 
        db.getClients(), 
        db.getLogs(),
        db.getUsers(),
        db.getAuditLogs(),
        db.getChangeRequests(),
        db.getLeads()
      ]);
      setProjects(p);
      setClients(c);
      setLogs(l);
      setUsers(u);
      setAuditLogs(a);
      setRequests(r);
      setLeads(ld);
    } catch (error) {
      console.error("Erro ao sincronizar banco:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activeProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const activeClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);
  const projectLogs = useMemo(() => logs.filter(l => l.projectId === selectedProjectId), [logs, selectedProjectId]);

  const getClientPrestige = (client: Client) => {
    if (client.isVip) return { label: 'DIAMANTE VIP (1)', icon: '💎', color: 'text-blue-400', badge: 'bg-blue-50 border-blue-100 text-blue-600', rank: 'DIAMANTE' };
    const count = projects.filter(p => p.clientId === client.id).length;
    if (count >= 10) return { label: `OURO (${count})`, icon: '🥇', color: 'text-amber-500', badge: 'bg-amber-50 border-amber-100 text-amber-600', rank: 'OURO' };
    if (count >= 3) return { label: `PRATA (${count})`, icon: '🥈', color: 'text-slate-400', badge: 'bg-slate-50 border-slate-200 text-slate-500', rank: 'PRATA' };
    return { label: `BRONZE (${count})`, icon: '🥉', color: 'text-orange-400', badge: 'bg-orange-50 border-orange-100 text-orange-600', rank: 'BRONZE' };
  };

  const handleBriefing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = f.get('rawText') as string;
    if (!text) return;
    setBriefingLoading(true);
    try {
      const result = await geminiService.processSmartBriefing(text);
      setBriefingResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setBriefingLoading(false);
    }
  };

  const SidebarContent = (
    <nav className="space-y-1">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Administração</div>
      <button onClick={() => setView('overview')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span>Painel IA</span>
      </button>
      <button onClick={() => setView('projects')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'projects' || view === 'project-detail' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <span>Projetos</span>
      </button>
      <button onClick={() => setView('requests')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Solicitações</span>
      </button>
      <button onClick={() => setView('clients')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'clients' || view === 'client-detail' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span>Parceiros</span>
      </button>

      <div className="pt-4 mt-4 border-t border-slate-900">
        <button onClick={() => setView('users')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Acessos</span>
        </button>
        <button onClick={() => setView('audit')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          <span>Auditoria</span>
        </button>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-900">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Engenharia IA</div>
        <button onClick={() => setView('crm')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'crm' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
           <span>Funil de Leads</span>
        </button>
        <button onClick={() => setView('briefing')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'briefing' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          <span>Briefing Mágico</span>
        </button>
      </div>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 font-black text-blue-500 animate-pulse uppercase tracking-[0.5em] text-[10px]">Sincronizando Matriz...</div>;

  return (
    <Layout title="Control Hub Admin" roleTag="ACESSO ROOT" sidebar={SidebarContent}>
      
      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3 space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pipeline CRM</p>
                    <p className="text-4xl font-black text-emerald-600">R$ {leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0).toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Projetos Ativos</p>
                    <p className="text-4xl font-black text-slate-900">{projects.length}</p>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Novos Leads</p>
                    <p className="text-4xl font-black text-blue-600">{leads.filter(l => l.status === LeadStatus.PROSPECT).length}</p>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tickets Abertos</p>
                    <p className="text-4xl font-black text-rose-600">{requests.filter(r => r.status === RequestStatus.OPEN).length}</p>
                 </div>
              </div>
              <ChatPanel type="admin" title="Engenheiro IA" description="Análise Estratégica" />
           </div>
           <div className="bg-slate-950 rounded-[48px] p-10 text-white shadow-2xl h-fit max-h-[750px] overflow-y-auto">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-blue-400">Atividade Recente</h3>
              <div className="space-y-6">
                 {logs.slice(0, 15).map(l => (
                   <div key={l.id} className="border-l-2 border-slate-800 pl-4 py-1">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{new Date(l.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs font-bold leading-tight text-slate-200">{l.title}</p>
                   </div>
                 ))}
                 {logs.length === 0 && <p className="text-slate-600 italic text-xs">Nenhum log disponível.</p>}
              </div>
           </div>
        </div>
      )}

      {view === 'projects' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <div className="flex justify-between items-end">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Ecossistemas</h2>
             <button onClick={() => setShowModal('project')} className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Novo Projeto</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {projects.map(p => (
                <div key={p.id} className="bg-white p-10 rounded-[48px] border shadow-sm flex flex-col group hover:shadow-xl transition-all">
                   <div className="flex justify-between mb-8">
                      <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[9px] font-black border border-blue-100 uppercase tracking-widest">{p.status}</span>
                   </div>
                   <h3 className="text-3xl font-black mb-4 group-hover:text-blue-600 transition-colors tracking-tight">{p.name}</h3>
                   <p className="text-slate-500 mb-8 line-clamp-3 font-medium leading-relaxed">{p.description}</p>
                   <button onClick={() => { setSelectedProjectId(p.id); setView('project-detail'); }} className="mt-auto py-5 bg-slate-50 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Ver Engenharia</button>
                </div>
              ))}
           </div>
        </div>
      )}

      {view === 'project-detail' && activeProject && (
        <div className="animate-in fade-in space-y-10">
           <div className="flex justify-between items-start">
              <button onClick={() => setView('projects')} className="text-slate-400 font-black text-[10px] tracking-widest flex items-center space-x-2 hover:text-slate-900 transition-colors uppercase">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                 <span>Voltar aos Projetos</span>
              </button>
              <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Configurar Projeto</button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                 <div className="bg-white p-16 rounded-[64px] border shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-16">
                       <h2 className="text-6xl font-black tracking-tighter text-slate-900">{activeProject.name}</h2>
                       <span className="px-6 py-2 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">{activeProject.status}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-b border-slate-50 mb-12">
                       <LighthouseGauge value={activeProject.lighthouseMetrics?.performance} label="Performance" />
                       <LighthouseGauge value={activeProject.lighthouseMetrics?.accessibility} label="Acessibilidade" />
                       <LighthouseGauge value={activeProject.lighthouseMetrics?.bestPractices} label="Boas Práticas" />
                       <LighthouseGauge value={activeProject.lighthouseMetrics?.seo} label="SEO" />
                    </div>

                    <div className="mb-12">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Stack Tecnológica</p>
                       <div className="flex flex-wrap gap-3">
                          {activeProject.stack.split(',').map((s, i) => (
                            <span key={i} className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black text-slate-700 shadow-sm">{s.trim()}</span>
                          ))}
                       </div>
                    </div>

                    <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed mb-16">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeProject.description}</ReactMarkdown>
                    </div>

                    <div className="pt-12 border-t border-slate-50">
                       <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-8">Linha do Tempo / Logs</h4>
                       <div className="space-y-6">
                          {projectLogs.map(l => (
                            <div key={l.id} className="flex space-x-6 group">
                               <div className="pt-1.5 flex flex-col items-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100"></div>
                                  <div className="w-0.5 h-full bg-slate-100 group-last:hidden"></div>
                               </div>
                               <div className="pb-8">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(l.createdAt).toLocaleDateString()}</p>
                                  <p className="font-bold text-slate-900">{l.title}</p>
                                  <p className="text-sm text-slate-500 mt-2 font-medium">{l.description}</p>
                               </div>
                            </div>
                          ))}
                          {projectLogs.length === 0 && <p className="text-slate-400 italic text-sm">Nenhum log registrado para este projeto.</p>}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-10">
                 <div className="bg-slate-950 p-10 rounded-[48px] text-white shadow-2xl border border-slate-900">
                    <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.2em] mb-8">Ecossistema Live</p>
                    <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 flex justify-between items-center group cursor-pointer hover:border-blue-500/50 transition-all">
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Status Ativo</p>
                          <p className="text-lg font-black tracking-tight uppercase">Produção</p>
                       </div>
                       <div className="p-3 rounded-xl bg-slate-800 group-hover:bg-blue-600 transition-all">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                       </div>
                    </div>
                 </div>
                 <ChatPanel type="admin" title="Engenheiro IA" description={`Analisando ${activeProject.name}`} />
              </div>
           </div>
        </div>
      )}

      {view === 'clients' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <div className="flex justify-between items-end">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Parceiros de Negócio</h2>
             <button onClick={() => setShowModal('client')} className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Novo Parceiro</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             {clients.map(c => {
               const prestige = getClientPrestige(c);
               return (
                <div key={c.id} className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm relative group hover:shadow-2xl transition-all">
                   <div className="absolute top-10 right-10">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                         <span className="text-lg">{prestige.icon}</span>
                      </div>
                   </div>
                   <div className="w-16 h-16 rounded-[24px] bg-slate-50 border flex items-center justify-center mb-8 group-hover:bg-blue-50 transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 leading-tight mb-2 tracking-tight">{c.companyName}</h3>
                   <p className="text-slate-400 font-bold mb-10 tracking-tight text-sm">{c.contactName} • {c.email}</p>
                   <div className="pt-10 border-t border-slate-50 flex justify-between items-center">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${prestige.badge}`}>
                        {prestige.label}
                      </span>
                      <button onClick={() => { setSelectedClientId(c.id); setView('client-detail'); }} className="text-blue-600 font-black text-[10px] tracking-widest uppercase hover:underline">Ver Perfil</button>
                   </div>
                </div>
               );
             })}
           </div>
        </div>
      )}

      {view === 'client-detail' && activeClient && (
        <div className="animate-in fade-in space-y-12">
           <div className="flex justify-between items-start">
              <button onClick={() => setView('clients')} className="text-slate-400 font-black text-[10px] tracking-widest flex items-center space-x-2 hover:text-slate-900 transition-colors uppercase">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                 <span>Voltar aos Parceiros</span>
              </button>
              <button onClick={async () => {
                await db.updateClient(activeClient.id, { isVip: !activeClient.isVip }, currentUser?.name || 'Admin');
                loadData();
              }} className="bg-amber-100 text-amber-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-amber-600 hover:text-white transition-all border border-amber-200">
                {activeClient.isVip ? 'Remover VIP' : 'Promover a VIP'}
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3 space-y-12">
                 <div className="bg-white p-16 rounded-[64px] border shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-16">
                       <div>
                          <h2 className="text-6xl font-black tracking-tighter text-slate-900 mb-2">{activeClient.companyName}</h2>
                          <p className="text-2xl font-black text-slate-300 tracking-tight">{activeClient.contactName}</p>
                       </div>
                       <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 shadow-inner">
                          <span className="text-4xl">{getClientPrestige(activeClient).icon}</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-slate-50">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">E-mail de Contato</p>
                          <p className="text-xl font-black text-slate-900">{activeClient.email}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">WhatsApp / Tel</p>
                          <p className="text-xl font-black text-slate-900">{activeClient.phone || 'Não informado'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <h3 className="text-2xl font-black tracking-tighter text-slate-900">Projetos no Ecossistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {projects.filter(p => p.clientId === activeClient.id).map(p => (
                         <div key={p.id} onClick={() => { setSelectedProjectId(p.id); setView('project-detail'); }} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">{p.name}</h4>
                            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[9px] font-black border border-blue-100 uppercase tracking-widest">{p.status}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-12 h-fit sticky top-10">
                 <div className="bg-slate-950 p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden text-center">
                    <div className="relative z-10">
                       <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl">
                          <span className="text-4xl">{getClientPrestige(activeClient).icon}</span>
                       </div>
                       <h4 className="text-3xl font-black mb-2 tracking-tighter">Selo de Prestígio</h4>
                       <p className={`font-black uppercase text-[10px] tracking-[0.3em] mb-8 ${getClientPrestige(activeClient).color}`}>{getClientPrestige(activeClient).rank}</p>
                       <div className="bg-slate-900/50 p-8 rounded-[32px] border border-white/5 text-slate-400 font-medium text-sm italic leading-relaxed">
                          "Este parceiro demonstra um compromisso excepcional com a evolução digital através do Hub."
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {view === 'users' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <div className="flex justify-between items-end px-4">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Matriz de Acessos</h2>
             <button onClick={() => setShowModal('auth-profile')} className="bg-slate-950 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Autenticar Perfil</button>
           </div>
           <div className="bg-white rounded-[56px] border shadow-sm overflow-hidden p-10">
              <div className="grid grid-cols-12 gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 px-4">
                 <div className="col-span-5">Colaborador / UID</div>
                 <div className="col-span-4 text-center">Role</div>
                 <div className="col-span-3 text-right">Ação</div>
              </div>
              <div className="space-y-6">
                 {users.map(u => (
                    <div key={u.id} className="grid grid-cols-12 gap-6 p-10 bg-slate-50/50 rounded-[40px] items-center border border-transparent hover:border-slate-100 transition-all">
                       <div className="col-span-5">
                          <p className="text-2xl font-black text-slate-900 leading-tight mb-2">{u.name}</p>
                          <div className="inline-block bg-slate-200/50 px-3 py-1 rounded-lg">
                             <code className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">UID: {u.id}</code>
                          </div>
                       </div>
                       <div className="col-span-4 flex justify-center">
                          <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {u.role}
                          </span>
                       </div>
                       <div className="col-span-3 flex justify-end">
                          <button onClick={async () => {
                             if(confirm(`Remover acesso de ${u.name}?`)) {
                               await db.deleteUser(u.id, currentUser?.name || 'Admin');
                               loadData();
                             }
                          }} className="px-10 py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">Remover</button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {view === 'crm' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <div className="flex justify-between items-end px-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Funil de Leads (CRM)</h2>
              <button onClick={() => setShowModal('lead')} className="bg-emerald-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Novo Lead</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
              {[LeadStatus.PROSPECT, LeadStatus.NEGOTIATING, LeadStatus.PROPOSAL_SENT, LeadStatus.WON].map(status => (
                <div key={status} className="bg-slate-100/50 p-6 rounded-[32px] border-2 border-slate-100 min-h-[600px] flex flex-col">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 px-2">{status}</h4>
                   <div className="space-y-4">
                      {leads.filter(l => l.status === status).map(lead => (
                        <div key={lead.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden">
                           <p className="font-black text-slate-900 text-xl mb-1 tracking-tight leading-tight">{lead.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 tracking-widest">{lead.company}</p>
                           <div className="flex justify-between items-center">
                              <p className="text-sm font-black text-emerald-600">R$ {lead.estimatedValue.toLocaleString()}</p>
                              <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">Mover</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {view === 'requests' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <h2 className="text-5xl font-black text-slate-900 tracking-tighter px-4">Central de Solicitações</h2>
           <div className="grid grid-cols-1 md:grid-cols-1 gap-12 px-4 max-w-4xl">
             {requests.map(r => (
               <div key={r.id} className="bg-white p-16 rounded-[64px] border border-slate-200 shadow-sm flex flex-col group hover:shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-12">
                    <span className="px-5 py-2 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">{r.status}</span>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">By: {clients.find(c => c.id === r.clientId)?.companyName || 'Unknown'}</p>
                  </div>
                  <h4 className="text-4xl font-black mb-8 tracking-tighter">{r.title}</h4>
                  <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 text-slate-500 font-bold leading-relaxed mb-12 text-lg">
                    {r.description}
                  </div>
                  
                  <div className="space-y-6">
                     <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resposta do Admin</p>
                        <button 
                          onClick={async () => {
                             setSuggestingResponse(r.id);
                             const project = projects.find(p => p.id === r.projectId);
                             const sugg = await geminiService.suggestTicketResponse(r, project?.name || 'Projeto Hub');
                             setSuggestingResponse(null);
                             // Mostra o modal de sugestão
                             alert("Sugestão IA:\n" + sugg);
                          }}
                          className="flex items-center space-x-2 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                        >
                           <span className="text-xs">🤖</span>
                           <span>{suggestingResponse === r.id ? 'Gerando...' : 'IA: Sugerir Resposta'}</span>
                        </button>
                     </div>
                     <textarea 
                       id={`resp-${r.id}`}
                       placeholder="Proposta de solução técnica..."
                       className="w-full p-10 bg-white border-2 border-slate-100 rounded-[48px] text-lg font-bold outline-none focus:border-blue-500 h-48 resize-none shadow-inner"
                       defaultValue={r.adminComment}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-6 mt-12">
                     <button onClick={async () => {
                        const val = (document.getElementById(`resp-${r.id}`) as HTMLTextAreaElement).value;
                        await db.updateRequestStatus(r.id, RequestStatus.DONE, val, currentUser?.name || 'Admin');
                        loadData();
                     }} className="py-6 bg-slate-900 text-white rounded-[28px] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Finalizar Ticket</button>
                     <button onClick={async () => {
                        const val = (document.getElementById(`resp-${r.id}`) as HTMLTextAreaElement).value;
                        await db.updateRequestStatus(r.id, RequestStatus.REVIEWING, val, currentUser?.name || 'Admin');
                        loadData();
                     }} className="py-6 bg-blue-50 text-blue-600 rounded-[28px] text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">Salvar Resposta</button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {view === 'briefing' && (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in">
           <div className="bg-white p-16 rounded-[64px] border shadow-2xl">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Briefing Mágico</h2>
              <p className="text-slate-500 font-medium mb-12">Converta diálogos brutos em especificações de arquitetura Hub.</p>
              <form onSubmit={handleBriefing} className="space-y-8">
                 <textarea name="rawText" className="w-full p-10 bg-slate-50 border-none rounded-[48px] h-72 font-medium text-lg outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none" placeholder="O cliente mandou no WhatsApp que..." />
                 <button type="submit" disabled={briefingLoading} className="w-full py-7 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[32px] font-black shadow-2xl uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all">
                   {briefingLoading ? '🤖 ARQUITETANDO...' : '✨ GERAR ESTRUTURA HUB'}
                 </button>
              </form>
           </div>
           {briefingResult && (
             <div className="bg-slate-950 rounded-[64px] p-20 text-white animate-in zoom-in-95 shadow-2xl">
                <div className="flex justify-between items-start mb-16">
                   <h2 className="text-5xl font-black tracking-tight">{briefingResult.name}</h2>
                   <span className="bg-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{briefingResult.projectType}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                   <div className="space-y-10">
                     <div>
                       <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-4">Escopo do Valor</p>
                       {/* Fix: Wrapped ReactMarkdown in a div to apply styles, as className is not supported on the component itself in some type definitions */}
                       <div className="prose prose-invert prose-sm leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{briefingResult.description}</ReactMarkdown>
                       </div>
                     </div>
                     <div className="bg-slate-900 p-8 rounded-[32px] border border-white/5">
                        <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest mb-4">Pontos Estratégicos</p>
                        <ul className="space-y-3">
                           {briefingResult.strategicPoints?.map((p: string, i: number) => (
                             <li key={i} className="text-sm font-medium flex items-center space-x-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <span>{p}</span>
                             </li>
                           ))}
                        </ul>
                     </div>
                   </div>
                   <div className="bg-slate-900 p-12 rounded-[48px] flex flex-col justify-between border border-white/5 h-fit">
                      <div>
                         <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest mb-6">Matriz de Tecnologia</p>
                         <p className="text-2xl font-black mb-10">{briefingResult.stack}</p>
                      </div>
                      <div className="pt-10 border-t border-white/5">
                         <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Valor Estimado do Contrato</p>
                         <p className="text-5xl font-black text-emerald-500 tracking-tighter">R$ {briefingResult.estimatedValue?.toLocaleString()}</p>
                         <button onClick={() => {
                            // Preencher formulário de lead ou projeto com estes dados
                            alert("Dados capturados pela IA. Pronto para exportar.");
                         }} className="w-full mt-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 hover:text-white transition-all">Importar para Leads</button>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* MODALS CORRIGIDOS */}
      {showModal === 'lead' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[100]">
           <div className="bg-white rounded-[56px] w-full max-w-2xl p-16 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black mb-10 tracking-tighter">Novo Lead Hub</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const leadData = {
                  name: f.get('name') as string,
                  company: f.get('company') as string,
                  email: f.get('email') as string,
                  phone: f.get('phone') as string,
                  status: LeadStatus.PROSPECT,
                  estimatedValue: Number(f.get('value')) || 0,
                  notes: f.get('notes') as string,
                  source: 'Inbound'
                };
                await db.addLead(leadData, currentUser?.name || 'Admin');
                setShowModal(null);
                loadData();
              }} className="space-y-6">
                 <input name="name" placeholder="Responsável" className="w-full p-7 bg-slate-50 rounded-[28px] font-black text-xl outline-none" required />
                 <input name="company" placeholder="Empresa" className="w-full p-7 bg-slate-50 rounded-[28px] font-bold outline-none" required />
                 <div className="grid grid-cols-2 gap-6">
                    <input name="email" placeholder="E-mail" className="p-7 bg-slate-50 rounded-[28px] font-bold outline-none" required />
                    <input name="value" type="number" placeholder="Valor Estimado" className="p-7 bg-slate-50 rounded-[28px] font-black text-emerald-600 outline-none" />
                 </div>
                 <div className="flex space-x-6 pt-10">
                    <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Cancelar</button>
                    <button type="submit" className="flex-1 py-5 bg-emerald-600 text-white rounded-[28px] font-black shadow-2xl uppercase tracking-widest text-xs">Salvar no Funil</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showModal === 'auth-profile' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 z-[100]">
           <div className="bg-white rounded-[56px] w-full max-w-2xl p-16 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-500/30">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tighter">Autenticar Perfil</h3>
              <p className="text-slate-500 mb-10">Vincule o UID do Firebase para habilitar o acesso ao Hub.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await db.saveUser({
                  id: f.get('uid') as string,
                  name: f.get('name') as string,
                  email: f.get('email') as string,
                  role: f.get('role') as UserRole,
                  clientId: (f.get('clientId') as string) || undefined,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }, currentUser?.name || 'Admin');
                setShowModal(null);
                loadData();
              }} className="space-y-6 text-left">
                 <input name="uid" placeholder="UID do Firebase" className="w-full p-7 bg-slate-50 rounded-[28px] font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500" required />
                 <input name="name" placeholder="Nome Completo" className="w-full p-7 bg-slate-50 rounded-[28px] font-black text-lg outline-none" required />
                 <input name="email" placeholder="E-mail de Login" className="w-full p-7 bg-slate-50 rounded-[28px] font-bold outline-none" required />
                 <div className="grid grid-cols-2 gap-6">
                    <select name="role" className="p-7 bg-slate-50 rounded-[28px] font-black text-xs uppercase tracking-widest outline-none">
                       <option value={UserRole.CLIENT}>CLIENTE</option>
                       <option value={UserRole.ADMIN}>ADMIN ROOT</option>
                    </select>
                    <select name="clientId" className="p-7 bg-slate-50 rounded-[28px] font-bold text-xs outline-none">
                       <option value="">Vincular Parceiro...</option>
                       {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                 </div>
                 <div className="flex space-x-6 pt-10">
                    <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-6 font-black text-slate-400 uppercase tracking-widest text-[10px]">Cancelar</button>
                    <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl uppercase tracking-widest text-[10px]">Ativar Credencial</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
