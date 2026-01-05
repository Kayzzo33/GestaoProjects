
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { ProjectStatus, Project, Client, ProjectLog, User, UserRole, AuditLog, LogType, ChangeRequest, RequestStatus } from '../types';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'overview' | 'projects' | 'project-detail' | 'clients' | 'users' | 'audit' | 'requests'>('overview');
  const [showModal, setShowModal] = useState<'project' | 'edit-project' | 'client' | 'log' | 'user' | null>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);

  const activeProject = projects.find(p => p.id === selectedProjectId);

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

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("AÇÃO IRREVERSÍVEL: Remover este usuário do sistema?")) return;
    try {
      await db.deleteUser(uid, user?.name || 'Admin');
      setUsers(prev => prev.filter(u => u.id !== uid));
    } catch (e) {
      alert("Erro ao processar exclusão no Firestore.");
    }
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const clientId = f.get('clientId') === 'PERSONAL' ? null : f.get('clientId') as string;
    
    await db.addProject({
      name: f.get('name') as string,
      description: f.get('description') as string,
      clientId: clientId,
      projectType: 'WEB',
      stack: f.get('stack') as string,
      productionUrl: f.get('productionUrl') as string,
      stagingUrl: f.get('stagingUrl') as string,
      repositoryUrl: '',
      figmaUrl: f.get('figmaUrl') as string,
      docsUrl: f.get('docsUrl') as string,
      status: f.get('status') as ProjectStatus,
      visibilityForClient: true,
      lighthouseMetrics: {
        performance: Number(f.get('perf')) || 0,
        accessibility: Number(f.get('acc')) || 0,
        bestPractices: Number(f.get('bp')) || 0,
        seo: Number(f.get('seo')) || 0
      },
      startDate: new Date().toISOString(),
      expectedEndDate: f.get('endDate') as string,
    }, user?.name || 'Admin');
    setShowModal(null);
    loadData();
  };

  const handleEditProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject) return;
    const f = new FormData(e.currentTarget);
    await db.updateProject(activeProject.id, {
      name: f.get('name') as string,
      description: f.get('description') as string,
      stack: f.get('stack') as string,
      productionUrl: f.get('productionUrl') as string,
      figmaUrl: f.get('figmaUrl') as string,
      docsUrl: f.get('docsUrl') as string,
      status: f.get('status') as ProjectStatus,
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
      notes: f.get('notes') as string,
    }, user?.name || 'Admin');
    setShowModal(null);
    loadData();
  };

  const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    const f = new FormData(e.currentTarget);
    await db.addLog({
      projectId: selectedProjectId,
      logType: f.get('type') as LogType,
      title: f.get('title') as string,
      description: f.get('description') as string,
      visibleToClient: f.get('visible') === 'on',
      createdBy: user?.name || 'Admin'
    });
    setShowModal(null);
    loadData();
  };

  const SidebarContent = (
    <nav className="space-y-1">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Administração</div>
      <button onClick={() => setView('overview')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span>Painel IA</span>
      </button>
      <button onClick={() => setView('projects')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'projects' || view === 'project-detail' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span>Projetos</span>
      </button>
      <button onClick={() => setView('requests')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Solicitações</span>
      </button>
      <button onClick={() => setView('clients')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'clients' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Parceiros</span>
      </button>
      <div className="pt-4 mt-4 border-t border-slate-800">
        <button onClick={() => setView('users')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Acessos</span>
        </button>
        <button onClick={() => setView('audit')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>Auditoria</span>
        </button>
      </div>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black text-slate-300 uppercase tracking-widest text-xs">Sincronizando Ecossistema...</div>;

  return (
    <Layout title="Control Hub Admin" roleTag="Acesso Root" sidebar={SidebarContent}>
      
      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-3 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Projetos</p>
                  <p className="text-4xl font-black text-slate-900">{projects.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tickets</p>
                  <p className="text-4xl font-black text-blue-600">{requests.filter(r => r.status === RequestStatus.OPEN).length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Atividade</p>
                  <p className="text-4xl font-black text-slate-900">{logs.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Parceiros</p>
                   <p className="text-4xl font-black text-slate-900">{clients.length}</p>
                </div>
             </div>
             <div className="bg-white rounded-[40px] border border-slate-200 p-12 shadow-sm">
               <h3 className="text-xl font-black mb-10 text-slate-900 flex items-center">
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-4 animate-pulse shadow-lg shadow-blue-500/50"></div>
                 Status da Infraestrutura
               </h3>
               <div className="space-y-6">
                 {logs.slice(0, 5).map(l => (
                   <div key={l.id} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between border border-transparent hover:border-slate-200 transition-all">
                     <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${l.logType === LogType.ISSUE ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                        <div>
                          <p className="font-black text-slate-900">{l.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(l.createdAt).toLocaleString()}</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-lg border uppercase tracking-widest">{l.logType}</span>
                   </div>
                 ))}
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
             <button onClick={() => setShowModal('project')} className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Novo Projeto</button>
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
           <div className="flex justify-between items-center">
             <button onClick={() => setView('projects')} className="text-slate-400 hover:text-slate-900 font-black text-xs flex items-center space-x-2">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
               <span>VOLTAR AOS PROJETOS</span>
             </button>
             <div className="flex space-x-4">
                <button onClick={() => setShowModal('edit-project')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl">EDITAR CONFIGS</button>
                <button onClick={() => setShowModal('log')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl">+ NOVA ATUALIZAÇÃO</button>
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div className="bg-white rounded-[48px] p-16 border border-slate-200 shadow-sm">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-8">{activeProject.name}</h2>
                  <div className="prose prose-slate max-w-none text-lg text-slate-600 font-medium leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeProject.description}</ReactMarkdown>
                  </div>
                  <div className="mt-12 pt-10 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Arquitetura do Projeto</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeProject.stack.split(',').map(s => (
                        <span key={s} className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-700 shadow-sm">{s.trim().toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-[48px] p-12 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-12">
                    <h3 className="text-xl font-black tracking-tight">Timeline de Engenharia</h3>
                    <button onClick={() => setShowModal('log')} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ Adicionar log rápido</button>
                  </div>
                  <div className="space-y-6">
                    {logs.filter(l => l.projectId === activeProject.id).length === 0 ? (
                      <p className="text-slate-400 text-sm italic py-10 text-center">Nenhum evento registrado nesta timeline.</p>
                    ) : (
                      logs.filter(l => l.projectId === activeProject.id).map(log => (
                        <div key={log.id} className="p-8 bg-slate-50 rounded-[32px] border border-transparent hover:border-slate-200 transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <h4 className="text-xl font-black text-slate-900">{log.title}</h4>
                             <div className="flex space-x-2">
                               {!log.visibleToClient && <span className="px-2 py-1 bg-rose-50 text-rose-500 text-[8px] font-black rounded-md border border-rose-100 uppercase">Privado</span>}
                               <span className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black text-slate-400 uppercase">{log.logType}</span>
                             </div>
                          </div>
                          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed font-medium">
                             <ReactMarkdown>{log.description}</ReactMarkdown>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-slate-900 rounded-[40px] p-10 text-white border border-slate-800 shadow-2xl">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-10">Score Lighthouse</h4>
                    <div className="space-y-8">
                       {[
                         {l: 'Performance', v: activeProject.lighthouseMetrics?.performance},
                         {l: 'Acessibilidade', v: activeProject.lighthouseMetrics?.accessibility},
                         {l: 'Boas Práticas', v: activeProject.lighthouseMetrics?.bestPractices},
                         {l: 'SEO', v: activeProject.lighthouseMetrics?.seo}
                       ].map(m => (
                         <div key={m.l} className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em]">
                               <span className="text-slate-500">{m.l}</span>
                               <span className={m.v && m.v >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{m.v || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div className={`h-full transition-all duration-1000 ${m.v && m.v >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${m.v || 0}%` }}></div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Conectividade</h4>
                    <div className="space-y-4">
                      {activeProject.productionUrl ? (
                        <a href={activeProject.productionUrl} target="_blank" className="block p-5 bg-slate-50 rounded-2xl border hover:border-blue-500 transition-all group">
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">PRODUÇÃO</p>
                           <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600">{activeProject.productionUrl}</p>
                        </a>
                      ) : (
                        <div className="p-5 bg-slate-50 rounded-2xl border text-slate-400 text-xs font-bold uppercase italic tracking-widest">Sem link de produção</div>
                      )}
                      {activeProject.figmaUrl && (
                        <a href={activeProject.figmaUrl} target="_blank" className="block p-5 bg-slate-50 rounded-2xl border hover:border-purple-500 transition-all group">
                           <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">DESIGN / FIGMA</p>
                           <p className="text-sm font-bold text-slate-800 truncate group-hover:text-purple-600">Abrir prototipagem</p>
                        </a>
                      )}
                    </div>
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
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhum chamado aberto</h3>
                <p className="text-slate-400 font-medium mt-2">Tudo em conformidade no ecossistema.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {requests.map(r => (
                 <div key={r.id} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                   <div className="flex justify-between mb-6">
                      <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl border border-blue-100 uppercase tracking-widest">{r.status}</span>
                   </div>
                   <h4 className="text-2xl font-black mb-4">{r.title}</h4>
                   <p className="text-slate-500 font-medium">{r.description}</p>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {view === 'clients' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-end px-2">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Parceiros de Negócio</h2>
             <button onClick={() => setShowModal('client')} className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">+ Novo Parceiro</button>
          </div>
          <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-12 py-10">Razão Social</th>
                    <th className="px-12 py-10">Key Contact</th>
                    <th className="px-12 py-10">E-mail</th>
                    <th className="px-12 py-10 text-right">Projetos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase tracking-widest">Nenhum parceiro cadastrado</td></tr>
                  ) : (
                    clients.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-12 py-10">
                          <p className="text-slate-900 font-black text-lg">{c.companyName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {c.id}</p>
                        </td>
                        <td className="px-12 py-10 font-bold text-slate-600">{c.contactName}</td>
                        <td className="px-12 py-10 font-bold text-slate-600">{c.email}</td>
                        <td className="px-12 py-10 text-right">
                          <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black border border-blue-100">
                            {projects.filter(p => p.clientId === c.id).length} ATIVOS
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>
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
                  <th className="px-12 py-10">Parceiro</th>
                  <th className="px-12 py-10 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-12 py-10">
                      <p className="text-slate-900 font-black text-lg">{u.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 rounded-md border tracking-tighter">UID: {u.id}</span>
                    </td>
                    <td className="px-12 py-10">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{u.role}</span>
                    </td>
                    <td className="px-12 py-10 text-slate-600 font-bold italic">{clients.find(c => c.id === u.clientId)?.companyName || 'Hub Core Team'}</td>
                    <td className="px-12 py-10 text-right">
                      <button onClick={() => handleDeleteUser(u.id)} className="text-rose-500 hover:text-rose-700 font-black text-[10px] tracking-widest px-6 py-3 border border-rose-100 hover:border-rose-300 rounded-xl transition-all">REMOVER</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'audit' && (
        <div className="space-y-10 animate-in fade-in">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Logs de Auditoria Root</h2>
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
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase tracking-widest">Nenhum registro de auditoria</td></tr>
                  ) : (
                    auditLogs.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-12 py-8 text-xs font-bold text-slate-400">{new Date(a.createdAt).toLocaleString()}</td>
                        <td className="px-12 py-8 text-sm font-black text-slate-900">{a.userName}</td>
                        <td className="px-12 py-8"><span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">{a.action}</span></td>
                        <td className="px-12 py-8 text-xs font-medium text-slate-500">{a.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODAL USER (AUTENTICAR) */}
      {showModal === 'user' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[48px] w-full max-w-2xl p-16 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black mb-10 tracking-tighter">Vincular Novo Perfil</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await db.saveUser({
                id: f.get('uid') as string,
                name: f.get('name') as string,
                email: f.get('email') as string,
                role: f.get('role') as UserRole,
                isActive: true,
                clientId: (f.get('clientId') as string) || undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, user?.name || 'Admin');
              setShowModal(null);
              loadData();
            }} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">UID Firebase (Auth)</label>
                <input name="uid" placeholder="Cole o UID do Authentication" className="w-full p-6 bg-slate-50 border-2 border-blue-100 rounded-[28px] font-black font-mono text-sm focus:border-blue-600 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <input name="name" placeholder="Nome Completo" className="w-full p-6 bg-slate-50 border rounded-[28px] font-bold" required />
                <input name="email" placeholder="E-mail de Login" className="w-full p-6 bg-slate-50 border rounded-[28px] font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <select name="role" className="w-full p-6 bg-slate-50 border rounded-[28px] font-black">
                  <option value={UserRole.CLIENT}>Cliente Parceiro</option>
                  <option value={UserRole.ADMIN}>Administrador Root</option>
                </select>
                <select name="clientId" className="w-full p-6 bg-slate-50 border rounded-[28px] font-black">
                  <option value="">Uso Interno (Admin)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div className="flex space-x-6 pt-10">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-6 font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl">Confirmar Vínculo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROJECT */}
      {showModal === 'project' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-[48px] w-full max-w-4xl p-16 shadow-2xl my-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-4xl font-black mb-12 tracking-tighter">Publicar Ecossistema</h3>
            <form onSubmit={handleAddProject} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-8">
                    <input name="name" placeholder="Título do Projeto" className="w-full p-6 bg-slate-50 border rounded-[24px] font-black outline-none focus:ring-2 focus:ring-blue-500/20" required />
                    <select name="clientId" className="w-full p-6 bg-slate-50 border rounded-[24px] font-black outline-none" required>
                      <option value="">Selecione o Cliente</option>
                      <option value="PERSONAL" className="text-blue-600 font-black">--- PROJETO PESSOAL (ADMIN) ---</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="perf" type="number" placeholder="Perf %" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                      <input name="acc" type="number" placeholder="Acc %" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                      <input name="bp" type="number" placeholder="Pract %" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                      <input name="seo" type="number" placeholder="SEO %" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                    </div>
                 </div>
                 <div className="space-y-8">
                    <input name="productionUrl" placeholder="URL em Produção" className="w-full p-6 bg-slate-50 border rounded-[24px] font-bold" />
                    <input name="figmaUrl" placeholder="Link Figma" className="w-full p-6 bg-slate-50 border rounded-[24px] font-bold" />
                    <input name="stack" placeholder="Stack (React, Firebase...)" className="w-full p-6 bg-slate-50 border rounded-[24px] font-bold" />
                    <select name="status" className="w-full p-6 bg-slate-50 border rounded-[24px] font-black">
                      {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
              </div>
              <textarea name="description" placeholder="Escopo Técnico (Markdown)" className="w-full p-8 bg-slate-50 border rounded-[32px] h-48 font-bold outline-none"></textarea>
              <div className="flex space-x-6">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-6 font-bold text-slate-400 hover:text-slate-600">Abortar</button>
                <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl">Consolidar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROJECT */}
      {showModal === 'edit-project' && activeProject && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50 overflow-y-auto">
           <div className="bg-white rounded-[48px] w-full max-w-4xl p-16 shadow-2xl my-8 animate-in zoom-in-95 duration-300">
             <h3 className="text-4xl font-black mb-12 tracking-tighter">Atualizar Configurações</h3>
             <form onSubmit={handleEditProject} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <input name="name" defaultValue={activeProject.name} className="w-full p-6 bg-slate-50 border rounded-2xl font-black" />
                      <input name="stack" defaultValue={activeProject.stack} className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" placeholder="Stack" />
                      <div className="grid grid-cols-2 gap-4">
                        <input name="perf" type="number" defaultValue={activeProject.lighthouseMetrics?.performance} placeholder="Perf" className="p-4 bg-slate-50 border rounded-xl font-bold" />
                        <input name="acc" type="number" defaultValue={activeProject.lighthouseMetrics?.accessibility} placeholder="Acc" className="p-4 bg-slate-50 border rounded-xl font-bold" />
                        <input name="bp" type="number" defaultValue={activeProject.lighthouseMetrics?.bestPractices} placeholder="Pract" className="p-4 bg-slate-50 border rounded-xl font-bold" />
                        <input name="seo" type="number" defaultValue={activeProject.lighthouseMetrics?.seo} placeholder="SEO" className="p-4 bg-slate-50 border rounded-xl font-bold" />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <input name="productionUrl" defaultValue={activeProject.productionUrl} className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" placeholder="Prod URL" />
                      <input name="figmaUrl" defaultValue={activeProject.figmaUrl} className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" placeholder="Figma URL" />
                      <input name="docsUrl" defaultValue={activeProject.docsUrl} className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" placeholder="Docs URL" />
                      <select name="status" defaultValue={activeProject.status} className="w-full p-6 bg-slate-50 border rounded-2xl font-black">
                        {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>
                <textarea name="description" defaultValue={activeProject.description} className="w-full p-6 bg-slate-50 border rounded-2xl h-40 font-bold"></textarea>
                <div className="flex space-x-4 pt-6">
                  <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 font-bold text-slate-400">Fechar</button>
                  <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black">Salvar Alterações</button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* MODAL CLIENT */}
      {showModal === 'client' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
           <div className="bg-white rounded-[48px] w-full max-w-xl p-16 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black mb-8">Novo Parceiro</h3>
              <form onSubmit={handleAddClient} className="space-y-6">
                 <input name="companyName" placeholder="Razão Social / Nome da Agência" className="w-full p-6 bg-slate-50 border rounded-2xl font-black" required />
                 <input name="contactName" placeholder="Nome do Responsável" className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" required />
                 <input name="email" type="email" placeholder="E-mail Operacional" className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" required />
                 <input name="phone" placeholder="WhatsApp / Telefone" className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" />
                 <textarea name="notes" placeholder="Notas estratégicas..." className="w-full p-6 bg-slate-50 border rounded-2xl h-32 font-medium"></textarea>
                 <div className="flex space-x-4 pt-6">
                    <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">Cadastrar Parceiro</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL LOG */}
      {showModal === 'log' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
           <div className="bg-white rounded-[48px] w-full max-w-xl p-16 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black mb-8">Nova Atualização</h3>
              <form onSubmit={handleAddLog} className="space-y-6">
                 <input name="title" placeholder="Título do Log" className="w-full p-6 bg-slate-50 border rounded-2xl font-bold" required />
                 <select name="type" className="w-full p-6 bg-slate-50 border rounded-2xl font-black">
                    {Object.values(LogType).map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
                 <textarea name="description" placeholder="Detalhes (Markdown)" className="w-full p-6 bg-slate-50 border rounded-2xl h-40 font-medium" required></textarea>
                 <div className="flex items-center space-x-3 px-2">
                    <input type="checkbox" name="visible" defaultChecked className="w-5 h-5 accent-blue-600" />
                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Visível para o Cliente</span>
                 </div>
                 <div className="flex space-x-4 pt-6">
                    <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                    <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">Publicar Log</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
