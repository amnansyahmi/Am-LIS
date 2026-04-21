import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { seedDatabase } from '../lib/seed';
import { 
  Users, 
  FlaskConical, 
  Clock, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  Database,
  Monitor,
  Zap,
  ShieldCheck,
  Layers,
  LineChart,
  BarChart3
} from 'lucide-react';
import LeveyJenningsChart from './LeveyJenningsChart';

interface Metric {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
}

const Dashboard: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [seeding, setSeeding] = useState(false);
  const [activeView, setActiveView] = useState<'Worklist' | 'QC'>('Worklist');
  const [stats, setStats] = useState({
    patients: 0,
    orders: 0,
    pending: 0,
    completed: 0
  });

  const [analyzers, setAnalyzers] = useState([
    { id: 'SYSMEX-XN10', name: 'Hematology Analyzer', status: 'Online', load: '45%' },
    { id: 'COBAS-C501', name: 'Chemistry Unit', status: 'Online', load: '12%' },
    { id: 'STAGO-COMP', name: 'Coagulation System', status: 'Standby', load: '0%' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const patientsSnap = await getDocs(collection(db, 'patients'));
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(d => d.data());
        
        setStats({
          patients: patientsSnap.size,
          orders: ordersSnap.size,
          pending: orders.filter(o => o.status === 'Pending').length,
          completed: orders.filter(o => o.status === 'Completed').length
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const handleSeed = async () => {
    setSeeding(true);
    await seedDatabase();
    setSeeding(false);
    window.location.reload(); 
  };

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const snap = await getDocs(q);
        setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to fetch recent orders:', err);
      }
    };
    fetchRecent();
  }, [stats.orders]); // Refresh when order count changes

  const metrics: Metric[] = [
    { label: 'Today\'s Throughput', value: stats.patients, icon: Users, trend: '+12% from yesterday', color: 'text-blue-600' },
    { label: 'Awaiting Results', value: stats.orders, icon: FlaskConical, trend: 'Standard volume', color: 'text-purple-600' },
    { label: 'Critical Flags', value: stats.pending, icon: Clock, trend: 'Requires urgent review', color: 'text-red-500' },
    { label: 'Turnaround Time', value: '4.2h', icon: Activity, trend: '-15m improvement', color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="glass-card p-6 group cursor-default">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">{m.label}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 group-hover:scale-105 transition-transform duration-300 origin-left">{m.value}</h3>
              <m.icon className={`${m.color} opacity-40`} size={24} />
            </div>
            <p className={`text-[11px] font-semibold mt-2 ${m.label.includes('Critical') ? 'text-red-500' : 'text-emerald-600'}`}>
              {m.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]">
        {/* Main Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex bg-white/40 p-1.5 rounded-2xl border border-black/5 shadow-inner w-fit">
            <button 
              onClick={() => setActiveView('Worklist')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${activeView === 'Worklist' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Zap size={14} /> Worklist Dashboard
            </button>
            <button 
              onClick={() => setActiveView('QC')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${activeView === 'QC' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LineChart size={14} /> Quality Management
            </button>
          </div>

          <div className="glass-panel flex-1">
            {activeView === 'Worklist' ? (
              <>
                <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center bg-white/20 text-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    <h2 className="text-lg font-bold">Clinical Queue</h2>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSeed} 
                      disabled={seeding}
                      className="glass-button text-xs py-2 px-4 flex items-center gap-2 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700"
                    >
                      <Database size={14} /> 
                      {seeding ? 'Syncing...' : 'Seed Data'}
                    </button>
                    <button className="glass-button text-xs py-2 px-4">Export Records</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/5">
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Subject</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Profile</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.03]">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                            No Records Synchronized
                          </td>
                        </tr>
                      ) : recentOrders.map((row, i) => (
                        <tr key={row.id} className="hover:bg-white/40 transition-colors cursor-pointer group">
                          <td className="px-6 py-5">
                            <p className="text-sm font-bold text-slate-800">{row.patientName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{row.id.substring(0, 10).toUpperCase()}</p>
                          </td>
                          <td className="px-6 py-5 text-xs text-slate-600 font-semibold">
                            {row.testIds?.length > 1 ? `${row.testIds.length} Panels` : 'Diagnostics'}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`status-pill ${
                              row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                              row.status === 'In-Progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-mono text-xs text-slate-400">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-amber-500" size={24} />
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">Analytical Quality Assurance</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Levey-Jennings Stability Monitoring</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select className="glass-input text-[10px] font-black uppercase py-1">
                      <option>COBAS-C501 Chemistry</option>
                      <option>SYSMEX-XN10 Hematology</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <LeveyJenningsChart 
                    title="Control Level 1 (Normal)"
                    mean={5.2}
                    sd={0.15}
                    data={[
                      { date: 'Apr 15', value: 5.1 },
                      { date: 'Apr 16', value: 5.3 },
                      { date: 'Apr 17', value: 5.2 },
                      { date: 'Apr 18', value: 4.8 },
                      { date: 'Apr 19', value: 5.25 },
                      { date: 'Apr 20', value: 5.15 },
                      { date: 'Apr 21', value: 5.22 },
                    ]}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { l: 'Mean', v: '142', u: 'mmol/L', s: 'Stable' },
                      { l: 'Precision', v: '0.8%', u: 'CV', s: 'Optimal' },
                      { l: 'Violations', v: '0', u: 'Flags', s: 'Compliant' }
                    ].map((item, i) => (
                      <div key={i} className="bg-white/20 p-4 rounded-2xl border border-black/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase">{item.l}</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{item.v} <span className="text-[10px] text-slate-400">{item.u}</span></p>
                        <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase">{item.s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel - Analyzer Monitor */}
        <div className="space-y-8">
          <div className="glass-panel">
            <div className="px-6 py-4 border-b border-black/5 bg-white/20 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Monitor size={18} className="text-blue-500" /> Decryptic Monitor
              </h2>
              <span className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <div className="p-6 space-y-4">
              {analyzers.map((a, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 bg-white/30 rounded-xl border border-black/[0.03]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{a.id}</p>
                      <p className="text-xs font-bold text-slate-700">{a.name}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      a.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${a.status === 'Online' ? 'bg-blue-500' : 'bg-slate-300'}`} 
                      style={{ width: a.load }} 
                    />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 text-center italic mt-4 font-medium">
                * Operational throughput is steady. All LIS-Analyser interfaces are verified.
              </p>
            </div>
          </div>

          <div className="glass-panel">
            <div className="px-6 py-4 border-b border-black/5 bg-white/20">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-blue-500" /> Active Disciplines
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                { name: 'Haematology', code: 'HEM' },
                { name: 'Biochemistry', code: 'BIO' },
                { name: 'Microbiology', code: 'MIC' },
                { name: 'Immunology', code: 'IMM' },
                { name: 'Molecular', code: 'MOL' },
                { name: 'Cytogenetics', code: 'CYT' },
                { name: 'AP', code: 'PATH' },
                { name: 'Point of Care', code: 'POC' }
              ].map(d => (
                <div key={d.code} className="bg-white/30 border border-black/[0.03] p-2 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700">{d.name}</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel">
            <div className="px-6 py-4 border-b border-black/5 bg-white/20">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-500" /> System Audit
              </h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[300px] font-sans">
            {[
              { time: '10:42 AM', user: 'Dr. Thorne', msg: 'validated Order #ORD-88211' },
              { time: '10:35 AM', user: 'System', msg: 'generated PDF report for #ORD-88190' },
              { time: '10:30 AM', user: 'Reception', msg: 'New patient Matt Donovan registered' },
              { time: '10:15 AM', user: 'Tech J. Smith', msg: 'marked #ORD-88215 as collected' },
            ].map((log, i) => (
              <div key={i} className="group flex gap-4">
                <span className="text-[10px] font-mono text-slate-400 mt-0.5 shrink-0">{log.time}</span>
                <p className="text-xs text-slate-600 leading-normal">
                  <span className="font-bold text-slate-900">{log.user}</span> {log.msg}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
