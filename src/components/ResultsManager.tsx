import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Result, Patient, UserProfile, Department } from '../types';
import { 
  ClipboardCheck, 
  Search, 
  FileDown, 
  Save, 
  CheckCircle,
  FlaskConical,
  AlertCircle,
  Settings2,
  FileText,
  Layers,
  Activity
} from 'lucide-react';
import { generateReport } from '../lib/reports';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const ResultsManager: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'Worksheet' | 'Designer'>('Worksheet');
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');

  const departments: (Department | 'All')[] = [
    'All',
    'Haematology',
    'Biochemistry',
    'Immunology',
    'Cytogenetics',
    'Molecular',
    'Microbiology',
    'Anatomical Pathology'
  ];

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', 'in', ['In-Progress', 'Completed']));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ordersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setActiveOrders(ordersData);
      
      const patientsSnap = await getDocs(collection(db, 'patients'));
      setPatients(patientsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      const q = query(collection(db, 'results'), where('orderId', '==', selectedOrderId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setResults(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Result)));
      });
      return () => unsubscribe();
    } else {
      setResults([]);
    }
  }, [selectedOrderId]);

  const handleUpdateResult = async (resultId: string, value: string) => {
    try {
      const docRef = doc(db, 'results', resultId);
      const res = results.find(r => r.id === resultId);
      if (!res) return;

      await updateDoc(docRef, { 
        value,
        technicianId: profile?.uid || 'Unknown',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const finalizeOrder = async () => {
    if (!selectedOrderId) return;
    try {
      const docRef = doc(db, 'orders', selectedOrderId);
      await updateDoc(docRef, { status: 'Completed' });
      
      const order = activeOrders.find(o => o.id === selectedOrderId);
      const patient = patients.find(p => p.id === order?.patientId);
      if (order && patient) {
        generateReport(patient, order, results);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Analytical Engine</h2>
          <div className="flex bg-white/40 p-1.5 rounded-2xl border border-black/5 shadow-inner">
            <button 
              onClick={() => setViewMode('Worksheet')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'Worksheet' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Entry Mode
            </button>
            <button 
              onClick={() => setViewMode('Designer')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'Designer' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Layout Designer
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar border-b border-black/5 mb-4">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedDept === dept 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/40 border-white/60 text-slate-500 hover:border-blue-500/30'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 glass-panel">
          <div className="glass-header !bg-white/40 flex justify-between items-center pr-4">
            <span>IN_ANALYTICAL_QUEUE</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-blue-500 uppercase">
                {activeOrders.filter(o => selectedDept === 'All' || o.department === selectedDept).length} LIVE
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-22rem)]">
            {activeOrders.filter(o => selectedDept === 'All' || o.department === selectedDept).map(o => (
              <button
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`w-full p-4 rounded-2xl transition-all border text-left flex items-start gap-4 ${
                  selectedOrderId === o.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 px-6' 
                    : 'bg-white/40 border-white/60 hover:border-blue-500/30 text-slate-900 px-4'
                }`}
              >
                <FlaskConical size={18} className="mt-1 shrink-0 opacity-60" />
                <div className="min-w-0">
                  <p className="font-extrabold text-sm leading-tight truncate">{o.patientName}</p>
                  <p className={`text-[10px] font-bold uppercase opacity-60 mt-1`}>
                    ORD-{o.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
              </button>
            ))}
            {activeOrders.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px]">Queue_Empty</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {viewMode === 'Designer' ? (
              <motion.div 
                key="designer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel min-h-[500px] flex flex-col items-center justify-center border-dashed border-2 bg-blue-50/10"
              >
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Settings2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800">Am-LIS Worksheet Designer</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm text-center font-medium leading-relaxed">
                  Intuitive drag-and-drop interface for building dynamic screen and print worksheets. Logic-based validation rules can be configured here.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-10 w-full max-w-md">
                  {['Heading', 'Calculation', 'Graph', 'Reference', 'Alert', 'Input'].map(c => (
                    <div key={c} className="p-4 bg-white/40 border border-purple-200 rounded-xl text-center cursor-move hover:bg-purple-50 transition-colors">
                      <p className="text-[9px] font-black uppercase text-purple-500">{c}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-10 px-6 py-2 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  Initialize Design Engine
                </div>
              </motion.div>
            ) : selectedOrderId ? (
              <motion.div 
                key={selectedOrderId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-panel"
              >
                <div className="px-8 py-6 border-b border-black/5 bg-white/20 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Analytic Worksheet</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] mt-1">Reference: {selectedOrderId.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const updated = results.map(r => ({
                          ...r,
                          value: (Math.random() * 10 + 2).toFixed(1),
                          flag: 'PASS [NORMAL]'
                        }));
                        setResults(updated);
                      }}
                      className="glass-button bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-2 px-4 hover:bg-blue-100 transition-colors"
                    >
                      <Activity size={14} /> Analyzer Sync
                    </button>
                    <button 
                      onClick={finalizeOrder}
                      className="glass-button bg-emerald-600 hover:bg-emerald-700 flex items-center gap-3 text-white px-6"
                    >
                      <CheckCircle size={16} /> Result Authorization
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl mb-8 flex gap-4 items-start">
                    <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Clinical Validation Required</p>
                      <p className="text-[10px] text-amber-700 mt-1 font-medium leading-relaxed">
                        Values outside the critical reference limits will trigger an automatic path-review alert. Ensure all specimens are visually verified.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {results.map((r) => (
                      <div key={r.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 bg-white/40 border border-white/60 rounded-2xl group hover:border-blue-300 transition-all">
                        <div className="md:col-span-4">
                          <p className="text-[10px] font-black text-blue-500 uppercase mb-1 tracking-widest">{r.testName}</p>
                          <p className="text-xs font-bold text-slate-400">Ref Range: 4.5 - 11.2 (mg/dL)</p>
                        </div>
                        <div className="md:col-span-5 flex gap-4 items-center">
                          <input 
                            type="text" 
                            value={r.value}
                            onChange={(e) => handleUpdateResult(r.id, e.target.value)}
                            placeholder="INPUT_VAL"
                            className="flex-1 bg-white border border-black/10 p-3 rounded-xl text-center font-black text-slate-900 outline-none focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                        <div className="md:col-span-3 text-right">
                          <select 
                            className={`status-pill w-full text-center border-none outline-none appearance-none cursor-pointer text-[10px] font-black ${
                              r.flag === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}
                            value={r.flag}
                            onChange={async (e) => {
                              const docRef = doc(db, 'results', r.id);
                              await updateDoc(docRef, { flag: e.target.value as any });
                            }}
                          >
                            <option value="Normal">PASS [NORMAL]</option>
                            <option value="High">HIGH [CRITICAL]</option>
                            <option value="Low">LOW [CRITICAL]</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel h-80 flex flex-col items-center justify-center text-slate-300">
                <FlaskConical size={64} className="opacity-10" />
                <p className="mt-4 font-bold text-[11px] uppercase tracking-[3px]">Analytical_Engine_Awaiting_Input</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ResultsManager;
