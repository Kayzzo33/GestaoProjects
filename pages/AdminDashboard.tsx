
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../App';
import { ProjectStatus, Project, Client, ProjectLog, User, UserRole, AuditLog, LogType } from '../types';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'overview' | 'projects' | 'clients' | 'users' | 'audit'>('overview');
  const [showModal, setShowModal] = useState<'project' | 'client' | 'user' | 'log' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c, l, u, a] = await Promise.all([
        db.getProjects(), 
        db.getClients(), 
        db.getLogs(),
        db.getUsers(),
        db.getAuditLogs()
      ]);
      setProjects(p);
      setClients(c);
      setLogs(l);
      setUsers(u);
      setAuditLogs(a);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await db.addClient({
      companyName: formData.get('companyName') as string,
      contactName: formData.get('contactName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      notes: formData.get('notes') as string,
    }, user?.name || 'Sistema');
    setShowModal(null);
    loadData();
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await db.addProject({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      clientId: formData.get('clientId') as string || undefined,
      projectType: formData.get('projectType') as string,
      stack: formData.get('stack') as string,
      productionUrl: formData.get('productionUrl') as string || '',
      stagingUrl: formData.get('stagingUrl') as string || '',
      repositoryUrl: formData.get('repositoryUrl') as string || '',
      status: formData.get('status') as ProjectStatus || ProjectStatus.IDEA,
      visibilityForClient: formData.get('visibility') === 'true',
      startDate: formData.get('startDate') as string || new Date().toISOString().split('T')[0],
      expectedEndDate: formData.get('endDate') as string,
    }, user?.name || 'Sistema');
    setShowModal(null);
    loadData();
  };

  const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    const formData = new FormData(e.currentTarget);
    await db.addLog({
      projectId: selectedProjectId,
      logType: formData.get('logType') as LogType,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      visibleToClient: formData.get('visible') === 'true',
      createdBy: user?.name || 'Admin'
    });
    setShowModal(null);
    loadData();
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.PRODUCTION: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ProjectStatus.DEVELOPMENT: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ProjectStatus.TESTING: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ProjectStatus.PAUSED: return 'bg-rose-50 text-rose-600 border-rose-100';
      case ProjectStatus.FINISHED: return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const SidebarContent = (
    <nav className="space-y-1">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Administração</div>
      <button onClick={() => setView('overview')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all ${view === 'overview' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span>Visão Geral</span>
      </button>
      <button onClick={() => setView('projects')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all ${view === 'projects' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
        <span>Projetos</span>
      </button>
      <button onClick={() => setView('clients')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all ${view === 'clients' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Clientes</span>
      </button>
      <div className="pt-4 mt-4 border-t border-slate-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Segurança</div>
        <button onClick={() => setView('users')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all ${view === 'users' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Acessos</span>
        </button>
        <button onClick={() => setView('audit')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all ${view === 'audit' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>Auditoria</span>
        </button>
      </div>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 font-medium bg-slate-50">Sincronizando Tech Hub...</div>;

  return (
    <Layout title="Control Hub Admin" roleTag="Acesso Root" sidebar={SidebarContent}>
      
      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projetos Ativos</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{projects.filter(p => !p.isArchived).length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{clients.length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Produção</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{projects.filter(p => p.status === ProjectStatus.PRODUCTION).length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atenção IA</p>
                <p className="text-3xl font-bold text-rose-500 mt-1">{projects.filter(p => p.status === ProjectStatus.PAUSED || p.status === ProjectStatus.TESTING).length}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                <svg className="mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Últimas Atualizações de Projeto
              </h3>
              <div className="space-y-4">
                {logs.slice(0, 8).map(l => (
                  <div key={l.id} className="flex items-start space-x-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${l.logType === LogType.ISSUE ? 'bg-rose-500' : l.logType === LogType.MILESTONE ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{l.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{l.description}</p>
                      <div className="flex items-center mt-2 space-x-3">
                         <span className="text-[10px] text-slate-400 flex items-center">
                           <svg className="mr-1" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                           {l.createdBy}
                         </span>
                         <span className="text-[10px] text-slate-400">•</span>
                         <span className="text-[10px] text-slate-400">{new Date(l.createdAt).toLocaleString()}</span>
                         {l.visibleToClient && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1 rounded border border-emerald-100">Visível p/ Cliente</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ChatPanel type="admin" title="Engenheiro de IA" description="Análise preditiva de riscos e logs." />
        </div>
      )}

      {view === 'projects' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Pipeline de Engenharia</h2>
              <p className="text-sm text-slate-500">Gestão técnica de portfólio e clientes.</p>
            </div>
            <button onClick={() => setShowModal('project')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm">+ Novo Projeto</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                    <button 
                      onClick={() => { setSelectedProjectId(p.id); setShowModal('log'); }}
                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                      title="Adicionar Atualização"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">{p.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-slate-400">
                      <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      {clients.find(c => c.id === p.clientId)?.companyName || 'Projeto Interno'}
                    </div>
                    <div className="flex items-center text-xs text-slate-400">
                      <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                      {p.stack || 'Stack não definida'}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                  <div className="flex -space-x-2">
                    {p.visibilityForClient ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-emerald-600" title="Visível para Cliente">V</span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500" title="Privado">P</span>
                    )}
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Ver Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'audit' && (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-slate-800">Trilha de Auditoria</h2>
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <tr>
                   <th className="px-6 py-4">Data/Hora</th>
                   <th className="px-6 py-4">Usuário</th>
                   <th className="px-6 py-4">Ação</th>
                   <th className="px-6 py-4">Detalhes</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {auditLogs.map(a => (
                   <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                     <td className="px-6 py-4 text-sm font-semibold text-slate-700">{a.userName}</td>
                     <td className="px-6 py-4">
                       <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">{a.action}</span>
                     </td>
                     <td className="px-6 py-4 text-xs text-slate-500">{a.details}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Modal Novo Projeto */}
      {showModal === 'project' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Novo Empreendimento</h3>
            <form onSubmit={handleAddProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título do Projeto</label>
                    <input name="name" placeholder="Ex: E-commerce V3" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente Responsável</label>
                    <select name="clientId" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Projeto Interno / Pessoal</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Inicial</label>
                    <select name="status" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none">
                      {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                   <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stack Tecnológica</label>
                    <input name="stack" placeholder="Ex: React, Node, Firebase" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Entrega</label>
                    <input name="endDate" type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div className="flex items-center space-x-3 pt-6">
                    <input type="checkbox" name="visibility" value="true" id="vis_check" defaultChecked className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="vis_check" className="text-sm font-medium text-slate-700">Visível no Portal do Cliente</label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição Detalhada</label>
                <textarea name="description" placeholder="Objetivos, escopo e requisitos..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none h-32"></textarea>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Descartar</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">Salvar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Log */}
      {showModal === 'log' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2 text-slate-800">Nova Atualização</h3>
            <p className="text-sm text-slate-500 mb-6">Registre o progresso técnico ou marcos do projeto.</p>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                  <select name="logType" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none">
                    {Object.values(LogType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Visibilidade</label>
                  <select name="visible" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none">
                    <option value="true">Público (Cliente Vê)</option>
                    <option value="false">Privado (Apenas Interno)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Atualização</label>
                <input name="title" placeholder="Ex: Deploy de Backend Finalizado" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descrição / Notas Técnicas</label>
                <textarea name="description" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none h-24" required></textarea>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all">Registrar Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default AdminDashboard;
