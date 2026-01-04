
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../db';
import ChatPanel from '../components/ChatPanel';
import { ProjectStatus, Project, Client, ProjectLog, User, UserRole } from '../types';

const AdminDashboard: React.FC = () => {
  const [view, setView] = useState<'overview' | 'projects' | 'clients' | 'users'>('overview');
  const [showModal, setShowModal] = useState<'project' | 'client' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c, l, u] = await Promise.all([
        db.getProjects(), 
        db.getClients(), 
        db.getLogs(),
        db.getUsers()
      ]);
      setProjects(p);
      setClients(c);
      setLogs(l);
      setUsers(u);
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
    });
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
      productionUrl: '',
      stagingUrl: '',
      repositoryUrl: '',
      status: ProjectStatus.IDEIA,
      visibilityForClient: formData.get('visibility') === 'true',
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: formData.get('endDate') as string,
    });
    setShowModal(null);
    loadData();
  };

  const handleSaveUserMetadata = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const uid = formData.get('uid') as string;
    
    await db.saveUser({
      id: uid,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      passwordHash: 'external-auth',
      role: formData.get('role') as UserRole,
      isActive: true,
      clientId: formData.get('clientId') as string || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowModal(null);
    loadData();
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
      <button onClick={() => setView('users')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all ${view === 'users' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span>Usuários / Cargos</span>
      </button>
    </nav>
  );

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 font-medium bg-slate-50">Sincronizando com Firestore...</div>;

  return (
    <Layout title="Administrador Hub" roleTag="Acesso Root" sidebar={SidebarContent}>
      
      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 font-medium">Projetos</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{projects.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 font-medium">Clientes</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{clients.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-500 font-medium">Usuários</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{users.length}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4">Atividades Recentes</h3>
              <div className="space-y-4">
                {logs.slice(-5).reverse().map(l => (
                  <div key={l.id} className="flex items-center space-x-3 text-sm border-b border-slate-50 pb-3 last:border-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="font-semibold text-slate-700">{l.title}</span>
                    <span className="text-slate-400 text-xs ml-auto">{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-slate-400 italic text-sm text-center py-4">Nenhum log registrado ainda.</p>}
              </div>
            </div>
          </div>
          <ChatPanel type="admin" title="Engenheiro de IA" description="Analista de dados e riscos operacionais." />
        </div>
      )}

      {view === 'projects' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Gestão de Projetos</h2>
            <button onClick={() => setShowModal('project')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all">+ Novo Projeto</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{clients.find(c => c.id === p.clientId)?.companyName || 'Projeto Interno'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] rounded font-bold border border-blue-100 uppercase">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'clients' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Diretório de Clientes</h2>
            <button onClick={() => setShowModal('client')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all">+ Novo Cliente</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <h3 className="font-bold text-lg text-slate-800">{c.companyName}</h3>
                <p className="text-sm text-slate-500 mt-1">{c.contactName}</p>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-xs text-slate-400">{c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Gestão de Acessos</h2>
              <p className="text-sm text-slate-500">Vincule cargos e clientes aos UIDs do Firebase Auth.</p>
            </div>
            <button onClick={() => setShowModal('user')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all">+ Vincular Usuário</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Vínculo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] rounded font-bold border uppercase ${
                        u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {u.clientId ? clients.find(c => c.id === u.clientId)?.companyName : 'Acesso Global'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais CRUD */}
      {showModal === 'user' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2">Vincular UID do Firebase</h3>
            <p className="text-xs text-slate-500 mb-6">Copie o UID da aba Authentication do Console e cole abaixo.</p>
            <form onSubmit={handleSaveUserMetadata} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">UID do Firebase Auth</label>
                <input name="uid" placeholder="Ex: aBc123Def..." className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                <input name="name" placeholder="Nome do Usuário" className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">E-mail</label>
                <input name="email" type="email" placeholder="E-mail de Login" className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Cargo / Papel</label>
                <select name="role" className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={UserRole.ADMIN}>Administrador (Acesso Total)</option>
                  <option value={UserRole.CLIENT}>Cliente (Acesso Limitado)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Vincular a Cliente (Opcional)</label>
                <select name="clientId" className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Nenhum (Uso para Admin)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">Salvar Vínculo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'client' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-6">Novo Cliente</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <input name="companyName" placeholder="Nome da Empresa" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
              <input name="contactName" placeholder="Pessoa de Contato" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
              <input name="email" type="email" placeholder="E-mail de Faturamento" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
              <input name="phone" placeholder="Telefone / WhatsApp" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea name="notes" placeholder="Observações Internas" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24"></textarea>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'project' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-6">Novo Projeto</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <input name="name" placeholder="Título do Projeto" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
              <select name="clientId" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Projeto Interno</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input name="projectType" placeholder="Tipo (Web/Mobile)" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                <input name="endDate" type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <input name="stack" placeholder="Tecnologias (React, Node...)" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              <select name="visibility" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                <option value="true">Visível para Cliente</option>
                <option value="false">Privado (Apenas Interno)</option>
              </select>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Criar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default AdminDashboard;
