
import React from 'react';
import { useAuth } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  roleTag: string;
  sidebar?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, roleTag, sidebar }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-64 bg-slate-950 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-8 flex items-center space-x-4 border-b border-slate-900">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg shadow-xl shadow-blue-500/20">H</div>
          <span className="text-2xl font-black tracking-tighter">Hub</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-1">
          {sidebar}
        </div>
        <div className="p-6 border-t border-slate-900">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black shadow-inner">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-black">{user?.role === 'ADMIN' ? 'Root Developer' : 'Parceiro'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-rose-900/40"
          >
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-100">
              {roleTag}
            </span>
          </div>
          <div className="flex items-center space-x-8">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status do Servidor</p>
              <div className="flex items-center justify-end space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ativo & Online</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
