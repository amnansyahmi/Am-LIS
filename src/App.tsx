import React, { useState } from 'react';
import { UserProfile, UserRole } from './types';
import Dashboard from './components/Dashboard';
import PatientManager from './components/PatientManager';
import OrderManager from './components/OrderManager';
import ResultsManager from './components/ResultsManager';
import AnalyzerInterface from './components/AnalyzerInterface';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FlaskConical, 
  Menu, 
  X,
  Stethoscope,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search as SearchIcon,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showAlertCenter, setShowAlertCenter] = useState(false);

  // Mock session for development
  const profile: UserProfile = {
    uid: 'dev-mode',
    email: 'admin@labflow.diag',
    name: 'Dr. Aris Thorne',
    role: 'Admin'
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patient Records', icon: Users },
    { id: 'orders', label: 'Diagnostic Orders', icon: ClipboardList },
    { id: 'results', label: 'Results Validation', icon: FlaskConical, role: ['Technician', 'Admin'] },
    { id: 'interface', label: 'LIS Interfacing', icon: Cpu, role: ['Admin'] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <AnimatePresence>
        {showAlertCenter && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-10 w-80 glass-panel z-[100] shadow-2xl !p-0 overflow-hidden border-blue-200/50"
          >
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-[2px]">Clinical Hub</h3>
              </div>
              <span className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded-full">3 URGENT</span>
            </div>
            <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
              {[
                { type: 'critical', title: 'Critical Potassium Level', subject: 'Emily Brown', time: '2m ago' },
                { type: 'alarm', title: 'Analyzer SYSMEX-XN10 Error', subject: 'Hardware Fault', time: '12m ago' },
                { type: 'info', title: 'Report Release Verified', subject: 'Spec #88192', time: '1h ago' },
              ].map((alert, i) => (
                <div key={i} className="p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-black/5">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                      alert.type === 'critical' ? 'bg-red-100 text-red-700' : 
                      alert.type === 'alarm' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>{alert.type}</span>
                    <span className="text-[9px] font-bold text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-[11px] font-black text-slate-900 leading-tight">{alert.title}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{alert.subject}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-black/5 bg-slate-50/50 text-center">
              <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Clear Protocol alerts</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar - Theme Specific */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-slate-900/85 backdrop-blur-md border-r border-white/10 text-slate-50 flex flex-col z-20"
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0 overflow-hidden">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-lg shrink-0">A</div>
          {isSidebarOpen && <div className="ml-3">
            <span className="font-extrabold text-lg tracking-tight block leading-none">Am-LIS</span>
            <span className="text-[10px] opacity-40 uppercase tracking-[2px] mt-1 block">V10 ENTERPRISE</span>
          </div>}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.role && !item.role.includes(profile?.role || '')) return null;
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all gap-4 ${
                  active ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {isSidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {isSidebarOpen && (
          <div className="m-4 p-5 bg-black/20 border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500 mb-1">{profile?.role} Access</p>
            <p className="text-sm font-bold truncate">{profile?.name}</p>
            <p className="text-[11px] opacity-50 mt-1">System Authentication Active</p>
          </div>
        )}


      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-white/40 border border-white/50 backdrop-blur-md rounded-xl text-slate-500 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'dashboard' ? 'Laboratory Overview' : 
                 activeTab === 'patients' ? 'Patient Records' : 
                 activeTab === 'orders' ? 'Test Archive' : 
                 activeTab === 'results' ? 'Results Validation' : 'Analyzer Interfacing'}
              </h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-0.5">Diagnostic Authority • {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAlertCenter(!showAlertCenter)}
              className={`p-2.5 rounded-xl transition-all relative ${showAlertCenter ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/40 border border-white/50 text-slate-500 hover:text-slate-900 shadow-sm'}`}
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">3</span>
            </button>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search Subjects..."
                className="glass-input w-64 pl-10 text-left placeholder:text-slate-400 group-hover:w-80 transition-all duration-500"
              />
              <SearchIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'dashboard' && <Dashboard profile={profile} />}
                {activeTab === 'patients' && <PatientManager />}
                {activeTab === 'orders' && <OrderManager profile={profile} />}
                {activeTab === 'results' && <ResultsManager profile={profile} />}
                {activeTab === 'interface' && <AnalyzerInterface />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppContent;
