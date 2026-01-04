
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
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">H</div>
          <span className="text-xl font-bold tracking-tight">Hub</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebar}
        </div>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate uppercase tracking-widest">{user?.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-200 rounded-lg transition-all text-sm font-medium"
          >
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-slate-800">{title}</h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-100">
              {roleTag}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Status do Servidor</p>
              <p className="text-xs font-bold text-emerald-500 flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                ONLINE
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
