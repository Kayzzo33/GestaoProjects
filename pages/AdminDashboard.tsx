
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { ProjectStatus, Project, Client, ProjectLog, User, UserRole, AuditLog, LogType, ChangeRequest, RequestStatus } from '../types';

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
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black">{safeValue}</span>
      </div>
      <span className="mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'overview' | 'projects' | 'project-detail' | 'clients' | 'client-detail' | 'users' | 'audit' | 'requests'>('overview');
  const [showModal, setShowModal] = useState<'project' | 'edit-project' | 'client' | 'log' | 'user' | null>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);

  const activeProject = useMemo(() => 
    showModal === 'edit-project' || view === 'project-detail' ? projects.find(p => p.id === selectedProjectId) : null
  , [projects, selectedProjectId, showModal, view]);

  const activeClient = clients.find(c => c.id === selectedClientId);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c, l, u, a, r] = await Promise.all([
        db.getProjects(), 
        db.getClients(), 
        db.getLogs(),
        db.getUsers(),
        db.getAuditLogs(),
        db.getChangeRequests()
      ]);
      setProjects(p);
      setClients(c);
      setLogs(l);
      setUsers(u);
      setAuditLogs(a);
      setRequests(r);
    } catch (error) {
      console.error("Erro ao sincronizar banco:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clientRanking = useMemo(() => {
    return clients
      .map(c => ({
        ...c,
        projectsCount: projects.filter(p => p.clientId === c.id).length
      }))
      .sort((a, b) => (b.projectsCount || 0) - (a.projectsCount || 0));
  }, [clients, projects]);

  const getRankData = (count: number) => {
    if (count >= 11) return { medal: '💎', category: 'DIAMANTE', color: 'text-cyan-500', bg: 'bg-cyan-50' };
    if (count >= 6) return { medal: '🥇', category: 'OURO', color: 'text-amber-500', bg: 'bg-amber-50' };
    if (count >= 3) return { medal: '🥈', category: 'PRATA', color: 'text-slate-400', bg: 'bg-slate-50' };
    if (count >= 1) return { medal: '🥉', category: 'BRONZE', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { medal: '🌱', category: 'INICIANTE', color: 'text-slate-300', bg: 'bg-white' };
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const clientId = f.get('clientId') === '' ? null : f.get('clientId') as string;
    
    await db.addProject({
      name: f.get('name') as string,
      description: f.get('description') as string,
      clientId: clientId,
      projectType: f.get('projectType') as string || 'WEB',
      stack: f.get('stack') as string,
      productionUrl: f.get('productionUrl') as string,
      stagingUrl: f.get('stagingUrl') as string,
      repositoryUrl: f.get('repositoryUrl') as string,
      figmaUrl: f.get('figmaUrl') as string,
      docsUrl: f.get('docsUrl') as string,
      status: f.get('status') as ProjectStatus,
      visibilityForClient: f.get('visibility') === 'true',
      lighthouseMetrics: {
        performance: Number(f.get('perf')) || 0,
        accessibility: Number(f.get('acc')) || 0,
        bestPractices: Number(f.get('bp')) || 0,
        seo: Number(f.get('seo')) || 0
      },
      startDate: f.get('startDate') as string || new Date().toISOString(),
      expectedEndDate: f.get('endDate') as string,
    }, user?.name || 'Admin');
    setShowModal(null);
    loadData();
  };

  const handleEditProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) return;
    const f = new FormData(e.currentTarget);
    const clientId = f.get('clientId') === '' ? null : f.get('clientId') as string;
    
    await db.updateProject(activeProject.id, {
      name: f.get('name') as string,
      description: f.get('description') as string,
      clientId: clientId,
      stack: f.get('stack') as string,
      productionUrl: f.get('productionUrl') as string,
      stagingUrl: f.get('stagingUrl') as string,
      figmaUrl: f.get('figmaUrl') as string,
      docsUrl: f.get('docsUrl') as string,
      status: f.get('status') as ProjectStatus,
      visibilityForClient: f.get('visibility') === 'true',
      lighthouseMetrics: {
        performance: Number(f.get('perf')) || 0,
        accessibility: Number(f.get('acc')) || 0,
        bestPractices: Number(f.get('bp')) || 0,
        seo: Number(f.get('seo')) || 0
      }
    }, user?.name || 'Admin');
    setShowModal(null);
    loadData();
  };

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await db.addClient({
      companyName: f.get('companyName') as string,
      contactName: f.get('contactName') as string,
      email: f.get('email') as string,
      phone: f.get('phone') as string,
      notes: f.get('notes') as string
    }, user?.name || 'Admin');
    setShowModal(null);
    loadData();
  };

  const SidebarContent = (
    <nav className="space-y-1">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Administração</div>
      <button onClick={() => setView('overview')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span>Painel IA</span>
      </button>
      <button onClick={() => setView('projects')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'projects' || view === 'project-detail' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span>Projetos</span>
      </button>
      <button onClick={() => setView('requests')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'requests' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Solicitações</span>
      </button>
      <button onClick={() => setView('clients')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'clients' || view === 'client-detail' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Parceiros</span>
      </button>
      <div className="pt-4 mt-4 border-t border-slate-800">
        <button onClick={() => setView('users')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Acessos</span>
        </button>
        <button onClick={() => setView('audit')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'audit' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>Auditoria</span>
        </button>
      </div>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black text-blue-500 uppercase tracking-widest text-xs animate-pulse">Sincronizando Ecossistema...</div>;

  return (
    <Layout title="Control Hub Admin" roleTag="Acesso Root" sidebar={SidebarContent}>
      
      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in">
          <div className="lg:col-span-3 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Projetos</p>
                  <p className="text-4xl font-black text-slate-900">{projects.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tickets</p>
                  <p className="text-4xl font-black text-blue-600">{requests.filter(r => r.status === RequestStatus.OPEN).length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative group overflow-hidden">
                   <div className="absolute -right-4 -top-4 text-6xl opacity-[0.05] grayscale group-hover:grayscale-0 transition-all duration-700">🏆</div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ranking Líder</p>
                  <p className="text-xl font-black text-slate-900 truncate">{clientRanking[0]?.companyName || '---'}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Parceiros</p>
                   <p className="text-4xl font-black text-slate-900">{clients.length}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
                 <h3 className="text-lg font-black mb-8 text-slate-900 flex items-center uppercase tracking-tighter">
                   <span className="mr-3">⭐</span> Ranking de Fidelidade
                 </h3>
                 <div className="space-y-4">
                    {clientRanking.slice(0, 5).map((c, idx) => {
                      const rd = getRankData(c.projectsCount || 0);
                      return (
                        <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center space-x-4">
                             <span className="text-lg font-black text-slate-300 w-6">#{idx + 1}</span>
                             <div>
                               <p className="font-black text-slate-900 text-sm">{c.companyName}</p>
                               <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${rd.bg} ${rd.color}`}>{rd.category}</span>
                             </div>
                          </div>
                          <span className="text-lg">{rd.medal}</span>
                        </div>
                      );
                    })}
                 </div>
               </div>

               <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
                 <h3 className="text-lg font-black mb-8 text-slate-900 flex items-center uppercase tracking-tighter">
                   <span className="mr-3">📡</span> Log Operacional
                 </h3>
                 <div className="space-y-4">
                   {logs.slice(0, 4).map(l => (
                    <div key={l.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-transparent">
                      <div className="flex items-center space-x-3">
                         <div className={`w-2 h-2 rounded-full ${l.logType === LogType.ISSUE ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                         <div>
                           <p className="font-black text-slate-900 text-xs">{l.title}</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(l.createdAt).toLocaleDateString()}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                 </div>
               </div>
             </div>
          </div>
          <ChatPanel type="admin" title="Engenheiro IA" description="Status Operacional" />
        </div>
      )}

      {view === 'projects' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-end">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Ecossistemas</h2>
             <button onClick={() => { setSelectedProjectId(null); setShowModal('project'); }} className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Novo Projeto</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(p => (
              <div key={p.id} className="bg-white rounded-[40px] border border-slate-200 p-12 flex flex-col group shadow-sm hover:shadow-2xl transition-all">
                 <div className="flex justify-between items-start mb-10">
                    <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest border ${
                      p.status === ProjectStatus.PRODUCTION ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>{p.status}</span>
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                 <p className="text-slate-500 mb-12 line-clamp-3 font-medium leading-relaxed">{p.description}</p>
                 <button onClick={() => { setSelectedProjectId(p.id); setView('project-detail'); }} className="mt-auto bg-slate-50 py-4 rounded-2xl text-xs font-black text-blue-600 tracking-widest hover:bg-blue-600 hover:text-white transition-all">VER DETALHES</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'project-detail' && activeProject && (
        <div className="space-y-10 animate-in fade-in">
          <div className="flex justify-between items-start">
            <button onClick={() => setView('projects')} className="text-slate-400 font-black text-[10px] tracking-widest flex items-center space-x-2 hover:text-slate-900">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              <span>VOLTAR AOS PROJETOS</span>
            </button>
            <div className="flex space-x-4">
               <button onClick={() => setShowModal('edit-project')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">Configurar Projeto</button>
            </div>
          </div>
          <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm">
              <h2 className="text-4xl font-black tracking-tighter mb-4">{activeProject.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-50">
                  <LighthouseGauge value={activeProject.lighthouseMetrics?.performance} label="Performance" />
                  <LighthouseGauge value={activeProject.lighthouseMetrics?.accessibility} label="Acessibilidade" />
                  <LighthouseGauge value={activeProject.lighthouseMetrics?.bestPractices} label="Boas Práticas" />
                  <LighthouseGauge value={activeProject.lighthouseMetrics?.seo} label="SEO" />
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
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {clients.map(c => {
               const projCount = projects.filter(p => p.clientId === c.id).length;
               const rd = getRankData(projCount);
               return (
                 <div key={c.id} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                    <div className={`absolute top-0 right-0 p-8 text-3xl opacity-20`}>{rd.medal}</div>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-8 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{c.companyName}</h3>
                    <p className="text-sm font-bold text-slate-400 mb-8 tracking-tight">{c.contactName} • {c.email}</p>
                    <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                       <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border ${rd.bg} ${rd.color}`}>{rd.category} ({projCount})</span>
                       <button onClick={() => { setSelectedClientId(c.id); setView('client-detail'); }} className="text-blue-600 font-black text-[10px] tracking-widest uppercase hover:underline">Ver Perfil</button>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {view === 'client-detail' && activeClient && (
        <div className="space-y-10 animate-in fade-in">
           <button onClick={() => setView('clients')} className="text-slate-400 font-black text-[10px] tracking-widest flex items-center space-x-2 hover:text-slate-900 uppercase">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              <span>Voltar aos Parceiros</span>
           </button>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              <div className="lg:col-span-2 space-y-10">
                 <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <h2 className="text-5xl font-black tracking-tighter text-slate-900">{activeClient.companyName}</h2>
                          <p className="text-slate-400 font-bold text-lg mt-2">{activeClient.contactName}</p>
                       </div>
                       {(() => {
                         const rd = getRankData(projects.filter(p => p.clientId === activeClient.id).length);
                         return <div className={`text-5xl p-6 ${rd.bg} rounded-3xl border border-slate-100`}>{rd.medal}</div>
                       })()}
                    </div>
                    <div className="grid grid-cols-2 gap-8 border-t border-slate-50 pt-10">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">E-mail de Contato</p>
                          <p className="font-bold text-slate-900">{activeClient.email}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp / Tel</p>
                          <p className="font-bold text-slate-900">{activeClient.phone || '---'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase px-4">Projetos no Ecossistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {projects.filter(p => p.clientId === activeClient.id).map(p => (
                         <div key={p.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                            <h4 className="font-black text-slate-900 text-lg mb-2">{p.name}</h4>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">{p.status}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="bg-slate-950 p-12 rounded-[56px] text-white shadow-2xl flex flex-col items-center text-center h-fit">
                 <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-8">
                    {getRankData(projects.filter(p => p.clientId === activeClient.id).length).medal}
                 </div>
                 <h3 className="text-2xl font-black tracking-tight mb-2">Selo de Prestígio</h3>
                 <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-[10px] mb-8">{getRankData(projects.filter(p => p.clientId === activeClient.id).length).category}</p>
                 <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 italic text-slate-400 text-sm leading-relaxed">
                    "Este parceiro demonstra um compromisso excepcional com a evolução digital através do Hub."
                 </div>
              </div>
           </div>
        </div>
      )}

      {view === 'requests' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Central de Solicitações</h2>
           {requests.length === 0 ? (
             <div className="bg-white rounded-[48px] p-32 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Sem solicitações no momento</h3>
                <p className="text-slate-400 font-medium mt-2">O ecossistema está operando em estabilidade total.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {requests.map(r => (
                 <div key={r.id} className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm">
                    <div className="flex justify-between mb-8">
                      <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl border border-blue-100 uppercase tracking-widest">{r.status}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">BY: {clients.find(c => c.id === r.clientId)?.companyName}</span>
                    </div>
                    <h4 className="text-2xl font-black mb-4 tracking-tight">{r.title}</h4>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed">{r.description}</p>
                    <div className="flex space-x-4 pt-8 border-t border-slate-50">
                      <button onClick={async () => {
                        await db.updateRequestStatus(r.id, RequestStatus.DONE, 'Finalizado via Admin', user?.name || 'Admin');
                        loadData();
                      }} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Marcar Concluído</button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {view === 'audit' && (
        <div className="space-y-10 animate-in fade-in">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter px-2">Logs de Auditoria Root</h2>
           {auditLogs.length === 0 ? (
             <div className="bg-white rounded-[48px] p-32 border border-slate-100 shadow-sm text-center">
                <p className="text-slate-300 font-black uppercase tracking-widest italic">Nenhum rastro de atividade encontrado.</p>
             </div>
           ) : (
             <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-12 py-8">Timestamp</th>
                      <th className="px-12 py-8">Operador</th>
                      <th className="px-12 py-8">Ação</th>
                      <th className="px-12 py-8">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-12 py-8 text-xs font-bold text-slate-400">{new Date(a.createdAt).toLocaleString()}</td>
                        <td className="px-12 py-8 text-sm font-black text-slate-900">{a.userName}</td>
                        <td className="px-12 py-8"><span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">{a.action}</span></td>
                        <td className="px-12 py-8 text-xs font-medium text-slate-500">{a.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )}
        </div>
      )}

      {view === 'users' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-end px-2">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Matriz de Acessos</h2>
             <button onClick={() => setShowModal('user')} className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:bg-black transition-all">+ Autenticar Perfil</button>
          </div>
          <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-12 py-10">Colaborador / UID</th>
                  <th className="px-12 py-10">Role</th>
                  <th className="px-12 py-10 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-12 py-10">
                      <p className="text-slate-900 font-black text-lg">{u.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 rounded-md border tracking-tighter">UID: {u.id}</span>
                      {u.phone && <p className="text-[10px] text-blue-500 font-bold mt-1">📞 {u.phone}</p>}
                    </td>
                    <td className="px-12 py-10">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{u.role}</span>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <button onClick={async () => {
                        if(confirm(`ATENÇÃO: Deseja remover permanentemente o acesso de ${u.name}?`)) {
                          await db.deleteUser(u.id, user?.name || 'Admin');
                          await loadData();
                        }
                      }} className="text-rose-500 hover:text-white font-black text-[10px] tracking-widest px-8 py-4 border-2 border-rose-100 hover:bg-rose-500 hover:border-rose-500 rounded-2xl transition-all">REMOVER</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NOVO/EDITAR PROJETO */}
      {(showModal === 'project' || showModal === 'edit-project') && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 z-[60] overflow-y-auto">
          <div className="bg-white rounded-[56px] w-full max-w-4xl p-16 shadow-2xl my-auto relative animate-in zoom-in-95 duration-300">
            <h3 className="text-4xl font-black mb-12 tracking-tighter text-slate-900">{showModal === 'project' ? 'Novo Ecossistema' : 'Configurar Ecossistema'}</h3>
            <form onSubmit={showModal === 'project' ? handleAddProject : handleEditProject} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Projeto</label>
                     <input name="name" defaultValue={showModal === 'edit-project' ? activeProject?.name : ''} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-xl outline-none focus:ring-4 focus:ring-blue-500/10" required />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Parceiro</label>
                     <select name="clientId" defaultValue={showModal === 'edit-project' ? activeProject?.clientId || '' : ''} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-lg outline-none">
                       <option value="">Uso Interno / Sem Parceiro</option>
                       {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status Atual</label>
                     <select name="status" defaultValue={showModal === 'edit-project' ? activeProject?.status || ProjectStatus.IDEA : ProjectStatus.IDEA} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-lg outline-none">
                       {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                     <input name="perf" type="number" placeholder="Perf" defaultValue={showModal === 'edit-project' ? activeProject?.lighthouseMetrics?.performance : 0} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-center" />
                     <input name="acc" type="number" placeholder="Acc" defaultValue={showModal === 'edit-project' ? activeProject?.lighthouseMetrics?.accessibility : 0} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-center" />
                   </div>
                   <input name="productionUrl" placeholder="Produção URL" defaultValue={showModal === 'edit-project' ? activeProject?.productionUrl : ''} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-bold outline-none" />
                   <input name="figmaUrl" placeholder="Figma URL" defaultValue={showModal === 'edit-project' ? activeProject?.figmaUrl : ''} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-bold outline-none" />
                   <input name="stack" placeholder="Stack Tecnológica" defaultValue={showModal === 'edit-project' ? activeProject?.stack : ''} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-bold outline-none" required />
                </div>
              </div>
              <textarea name="description" defaultValue={showModal === 'edit-project' ? activeProject?.description : ''} className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[40px] h-40 font-medium text-lg outline-none resize-none" required placeholder="Descrição do projeto..."></textarea>
              <div className="flex space-x-6 pt-6">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-6 font-black text-slate-400 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl uppercase tracking-widest">{showModal === 'project' ? 'INICIAR PROJETO' : 'SALVAR ALTERAÇÕES'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USER (VINCULAR PERFIL) */}
      {showModal === 'user' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[60]">
          <div className="bg-white rounded-[48px] w-full max-w-2xl p-16 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black mb-10 tracking-tighter text-slate-900">Vincular Novo Perfil</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await db.saveUser({
                  id: f.get('uid') as string,
                  name: f.get('name') as string,
                  email: f.get('email') as string,
                  phone: f.get('phone') as string,
                  role: f.get('role') as UserRole,
                  isActive: true,
                  clientId: (f.get('clientId') as string) || undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }, user?.name || 'Admin');
                setShowModal(null);
                loadData();
              } catch (err: any) {
                alert("Erro ao salvar perfil: " + err.message);
              }
            }} className="space-y-8">
              <input name="uid" placeholder="Cole o UID do Authentication" className="w-full p-6 bg-slate-50 border-2 border-blue-100 rounded-[28px] font-black font-mono text-sm outline-none focus:border-blue-600" required />
              <div className="grid grid-cols-2 gap-8">
                <input name="name" placeholder="Nome Completo" className="w-full p-6 bg-slate-50 border rounded-[28px] font-bold" required />
                <input name="email" placeholder="E-mail de Login" className="w-full p-6 bg-slate-50 border rounded-[28px] font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <input name="phone" placeholder="WhatsApp / Contato" className="w-full p-6 bg-slate-50 border rounded-[28px] font-bold" />
                <select name="role" className="w-full p-6 bg-slate-50 border rounded-[28px] font-black">
                  <option value={UserRole.CLIENT}>Cliente Parceiro</option>
                  <option value={UserRole.ADMIN}>Administrador Root</option>
                </select>
              </div>
              <div className="flex space-x-6 pt-10">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-6 font-bold text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl uppercase tracking-widest">Confirmar Vínculo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PARCEIRO */}
      {showModal === 'client' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[60]">
           <div className="bg-white rounded-[56px] w-full max-w-2xl p-16 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black mb-10 tracking-tighter text-slate-900">Novo Parceiro de Negócio</h3>
              <form onSubmit={handleAddClient} className="space-y-6">
                 <input name="companyName" placeholder="Nome da Empresa" className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[28px] font-black text-xl outline-none" required />
                 <input name="contactName" placeholder="Responsável Direto" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-bold outline-none" required />
                 <div className="grid grid-cols-2 gap-6">
                    <input name="email" placeholder="E-mail" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-bold outline-none" required />
                    <input name="phone" placeholder="WhatsApp" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] font-bold outline-none" />
                 </div>
                 <div className="flex space-x-6 pt-10">
                    <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-5 font-black text-slate-400">CANCELAR</button>
                    <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl uppercase tracking-widest">CADASTRAR</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
