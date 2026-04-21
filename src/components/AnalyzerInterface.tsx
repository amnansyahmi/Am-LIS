import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  ArrowRightLeft,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseORU, generateSampleHL7, HL7Message } from '../lib/hl7';
import { collection, query, getDocs, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

const AnalyzerInterface: React.FC = () => {
  const [logs, setLogs] = useState<{ id: string; time: string; msg: string; type: 'in' | 'out' | 'sys' }[]>([]);
  const [messages, setMessages] = useState<HL7Message[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [connectedAnalyzers] = useState([
    { id: 'SYSMEX-XN10', status: 'Online', type: 'Hematology', lastSync: '2m ago' },
    { id: 'COBAS-C6000', status: 'Online', type: 'Chemistry', lastSync: '5m ago' },
    { id: 'ROCHE-E411', status: 'Idle', type: 'Immunology', lastSync: '1h ago' }
  ]);

  const addLog = (msg: string, type: 'in' | 'out' | 'sys' = 'sys') => {
    setLogs(prev => [{
      id: Math.random().toString(36),
      time: new Date().toLocaleTimeString(),
      msg,
      type
    }, ...prev].slice(0, 50));
  };

  const processIncomingHL7 = async (raw: string) => {
    const parsed = parseORU(raw);
    addLog(`Received ORU^R01 from ${parsed.messageId.split('|')[0] || 'Analyzer'}`, 'in');
    setMessages(prev => [parsed, ...prev]);

    // Try to route to database
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('id', '==', parsed.orderId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const orderDoc = snap.docs[0];
        const orderData = orderDoc.data() as Order;
        
        addLog(`Routing ${parsed.results.length} results to Order #${parsed.orderId}`, 'sys');
        
        // In a real app, we would update the results subcollection or field
        // For this demo, we mark it as In-Progress and log success
        await updateDoc(doc(db, 'orders', orderDoc.id), {
          status: 'In-Progress',
          lastInterfaceSync: new Date().toISOString()
        });
        
        addLog(`Database Commit successful for Order #${parsed.orderId}`, 'sys');
      } else {
        addLog(`Warning: Target Order #${parsed.orderId} not found in LIS`, 'sys');
      }
    } catch (err) {
      addLog(`Critical: Routing Error - ${err instanceof Error ? err.message : 'Unknown'}`, 'sys');
    }
  };

  const simulateIncoming = async () => {
    setIsSimulating(true);
    addLog('Initiating Unidirectional Polling Mode...', 'sys');
    
    // Get a real order ID to make the simulation meaningful
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const randomOrder = ordersSnap.docs[Math.floor(Math.random() * ordersSnap.size)];
    const orderId = randomOrder?.id || 'ORD-TEST';
    const patientId = (randomOrder?.data() as any)?.patientId || 'PAT-001';

    setTimeout(() => {
      const hl7 = generateSampleHL7(orderId, patientId);
      processIncomingHL7(hl7);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {connectedAnalyzers.map(a => (
          <div key={a.id} className="glass-panel group">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                a.status === 'Online' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">{a.id}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.type}</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-black/5 p-3 rounded-xl border border-black/5">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                a.status === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
              }`}>{a.status}</span>
              <span className="text-[10px] text-slate-400 font-mono italic">Sync: {a.lastSync}</span>
            </div>
          </div>
        ))}

        <button 
          onClick={simulateIncoming}
          disabled={isSimulating}
          className="glass-panel flex flex-col items-center justify-center gap-3 bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <RefreshCw size={24} className={isSimulating ? 'animate-spin' : ''} />
          <span className="text-xs font-black uppercase tracking-widest">Trigger Data Pull</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
        {/* HL7 Live Console */}
        <div className="glass-panel flex flex-col bg-slate-900 overflow-hidden border-slate-800">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
              <Terminal size={14} className="text-blue-500" /> Interface_Console_V2.3
            </h2>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-500">LISTENING_PORT:5001</span>
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto space-y-2 bg-black/40">
            {logs.length === 0 && <p className="text-slate-600 italic">Waiting for interface events...</p>}
            {logs.map(log => (
              <div key={log.id} className="flex gap-4 group">
                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                <span className={`shrink-0 font-bold ${
                  log.type === 'in' ? 'text-blue-400' : 
                  log.type === 'out' ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {log.type === 'in' ? '<< RECV' : log.type === 'out' ? '>> SEND' : ':: SYNC'}
                </span>
                <span className="text-slate-300 break-all">{log.msg}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5 bg-slate-900/50 flex justify-between px-6">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Buffer Status: Optimal</span>
            <button 
              onClick={() => setLogs([])}
              className="text-[9px] font-black text-blue-400 uppercase hover:underline"
            >
              Clear Console
            </button>
          </div>
        </div>

        {/* Data Routing Table */}
        <div className="glass-panel flex flex-col">
          <div className="px-6 py-4 border-b border-black/5 bg-white/20">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Database size={18} className="text-blue-500" /> Intelligence Routing
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <ArrowRightLeft size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Transmissions Parsed</p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="bg-white/40 border border-black/5 rounded-2xl p-5 hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-1">HL7 Release ID: {m.messageId}</p>
                      <h4 className="text-sm font-black text-slate-900">Patient #{m.patientId} • Order #{m.orderId}</h4>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 size={12} /> ROUTED
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {m.results.map((r, idx) => (
                      <div key={idx} className="bg-black/5 p-2 rounded-xl border border-black/[0.03]">
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none truncate">{r.testName}</p>
                        <p className="text-xs font-black text-slate-800 mt-1">{r.value} <span className="text-[8px] font-normal text-slate-500">{r.unit}</span></p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzerInterface;
