import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  PieChart, 
  LogOut, 
  Menu, 
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { path: '/', label: '首页概览', icon: LayoutDashboard },
    { path: '/cases', label: '案例管理', icon: Briefcase },
    { path: '/tags', label: '标签统计', icon: PieChart },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Collapsible on Desktop, Drawer on Mobile */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 shadow-[2px_0_8px_rgba(0,0,0,0.04)] transform transition-all duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Logo Area */}
        <div className={`h-16 flex items-center border-b border-slate-100 bg-white transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
          </div>
          <div className={`ml-3 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">南网法险通</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">Legal Risk Control</p>
          </div>
        </div>

        {/* User Info (Compact) */}
        <div className={`py-6 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            <div className={`flex items-center rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center p-2' : 'p-3'}`}>
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base border-2 border-white shadow-sm flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className={`ml-3 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <p className="text-sm font-bold text-slate-700 truncate">{user?.name}</p>
                <div className="flex items-center mt-0.5">
                    <span className={`w-2 h-2 rounded-full mr-1.5 flex-shrink-0 ${user?.isAdmin ? 'bg-amber-400' : 'bg-brand-400'}`}></span>
                    <p className="text-xs text-slate-500 truncate">{user?.isAdmin ? '管理员' : '普通用户'}</p>
                </div>
              </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              title={isSidebarCollapsed ? item.label : ''}
              className={`
                flex items-center py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden
                ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}
                ${isActive(item.path) 
                  ? 'bg-brand-50 text-brand-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              {isActive(item.path) && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-600 rounded-r-full"></div>}
              <item.icon className={`w-5 h-5 transition-colors flex-shrink-0 ${isActive(item.path) ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`} />
              <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Footer / Toggle */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-all"
            title={isSidebarCollapsed ? "展开菜单" : "收起菜单"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <button
            onClick={logout}
            title={isSidebarCollapsed ? "退出登录" : ""}
            className={`
              w-full flex items-center text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100
              ${isSidebarCollapsed ? 'justify-center p-2' : 'px-4 py-2.5'}
            `}
          >
            <LogOut className={`w-4 h-4 flex-shrink-0 ${isSidebarCollapsed ? 'mr-0' : 'mr-2'}`} />
            <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              退出登录
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
          <div className="flex items-center">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700 mr-4 p-1 rounded-md hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              {navItems.find(n => isActive(n.path))?.label || '系统概览'}
              {isActive('/cases') && <span className="ml-3 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-normal border border-slate-200 hidden sm:inline-block">企业版</span>}
            </h2>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            <span className="text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;