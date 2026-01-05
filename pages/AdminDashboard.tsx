
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
    if (!window.confirm("AÇÃO CRÍTICA: Deseja realmente remover o acesso deste usuário?")) return;
    try {
      await db.deleteUser(uid, user?.name || 'Admin');
      // Atualização otimista da UI
      setUsers(prev => prev.filter(u => u.id !== uid));
      alert("Usuário removido com sucesso.");
    } catch (e: any) {
      console.error("Delete user error:", e);
      alert(`Erro ao remover: ${e.message || 'Verifique as regras do Firestore'}`);
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
      <button onClick={() => setView('clients')} className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold transition-all ${view === 'clients' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
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
                <div className="bg-white p-8 rounded-[32px] border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Projetos</p>
                  <p className="text-4xl font-black text-slate-900">{projects.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tickets</p>
                  <p className="text-4xl font-black text-blue-600">{requests.filter(r => r.status === RequestStatus.OPEN).length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Atividade</p>
                  <p className="text-4xl font-black text-slate-900">{logs.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Parceiros</p>
                   <p className="text-4xl font-black text-slate-900">{clients.length}</p>
                </div>
             </div>
             <div className="bg-white rounded-[40px] border border-slate-200 p-12 shadow-sm">
               <h3 className="text-xl font-black mb-10 text-slate-900 flex items-center">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-4 animate-pulse"></div>
                 Status da Infraestrutura
               </h3>
               <div className="space-y-6">
                 {logs.length === 0 ? (
                   <div className="py-10 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic">Aguardando primeiras atualizações...</div>
                 ) : (
                   logs.slice(0, 5).map(l => (
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
                  ))
                 )}
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

      {view === 'requests' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Central de Solicitações</h2>
           {requests.length === 0 ? (
             <div className="bg-white rounded-[48px] p-32 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Ainda não temos solicitações</h3>
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

      {view === 'users' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-end px-2">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Matriz de Acessos</h2>
             <button 
               onClick={() => {
                 console.log("Triggering showModal: user");
                 setShowModal('user');
               }} 
               className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black shadow-2xl hover:bg-black transition-all"
             >
               + Autenticar Perfil
             </button>
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
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase tracking-widest italic">Nenhum acesso autenticado</td></tr>
                ) : (
                  users.map(u => (
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
                        <button 
                          onClick={() => handleDeleteUser(u.id)} 
                          className="text-rose-500 hover:text-rose-700 font-black text-[10px] tracking-widest px-6 py-3 border border-rose-100 hover:border-rose-300 rounded-xl transition-all"
                        >
                          REMOVER
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'audit' && (
        <div className="space-y-10 animate-in fade-in">
           <div className="flex justify-between items-end">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Auditoria Root</h2>
             <button onClick={loadData} className="text-blue-500 font-black text-xs uppercase tracking-widest hover:underline">Sincronizar Agora</button>
           </div>
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
                    <tr><td colSpan={4} className="p-32 text-center font-black text-slate-300 uppercase tracking-widest italic">Aguardando primeiros registros de auditoria...</td></tr>
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

      {/* MODAL USER (AUTENTICAR) - RESTAURADO E TESTADO */}
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
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-6 font-bold text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-[28px] font-black shadow-2xl uppercase tracking-widest">Confirmar Vínculo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
