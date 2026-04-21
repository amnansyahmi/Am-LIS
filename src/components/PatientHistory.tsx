import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient, Order, Result } from '../types';
import { 
  History, 
  X, 
  FileText, 
  FlaskConical, 
  ChevronDown, 
  ChevronUp,
  Download,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { generateReport } from '../lib/reports';

interface PatientHistoryProps {
  patient: Patient;
  onClose: () => void;
}

const PatientHistory: React.FC<PatientHistoryProps> = ({ patient, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, Result[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Fetch all orders for this patient
        const ordersQ = query(
          collection(db, 'orders'), 
          where('patientId', '==', patient.id),
          orderBy('createdAt', 'desc')
        );
        const ordersSnap = await getDocs(ordersQ);
        const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        setOrders(ordersData);

        // Fetch results for these orders
        const newResultsMap: Record<string, Result[]> = {};
        for (const order of ordersData) {
          const resultsQ = query(collection(db, 'results'), where('orderId', '==', order.id));
          const resultsSnap = await getDocs(resultsQ);
          newResultsMap[order.id] = resultsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Result));
        }
        setResultsMap(newResultsMap);
      } catch (err) {
        console.error('Failed to fetch patient history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patient.id]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleDownload = (order: Order) => {
    const results = resultsMap[order.id] || [];
    generateReport(patient, order, results);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl glass-panel !p-0 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="glass-header !bg-white/40 flex justify-between items-center pr-4 shrink-0">
          <div className="flex items-center gap-2">
            <History size={16} className="text-blue-600" />
            <span className="uppercase tracking-widest font-black">Clinical_History_Log</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Patient Header */}
          <div className="flex items-center gap-6 pb-6 border-b border-black/5">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{patient.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User size={10} /> ID: {patient.id.substring(0, 8)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Activity size={10} /> {patient.gender} • {formatDate(patient.dob)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Historical Records</h3>
            
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                Synchronizing_Records...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-black/5 rounded-3xl">
                No_Diagnostic_History_Available
              </div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id} 
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    expandedOrder === order.id ? 'border-blue-200 bg-white shadow-xl shadow-blue-500/5' : 'border-black/5 bg-white/40 group hover:border-black/20'
                  }`}
                >
                  <div 
                    onClick={() => toggleOrder(order.id)}
                    className="p-5 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${expandedOrder === order.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{formatDate(order.createdAt)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">#{order.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {order.status === 'Completed' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(order);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      <div className="text-slate-300">
                        {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-black/5 bg-slate-50/50"
                      >
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resultsMap[order.id]?.length > 0 ? (
                              resultsMap[order.id].map((res) => (
                                <div key={res.id} className="bg-white p-4 rounded-xl border border-black/5 flex justify-between items-center shadow-sm">
                                  <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase mb-0.5 tracking-widest">{res.testName}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-black text-slate-900">{res.value}</span>
                                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                        res.flag === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                      }`}>
                                        {res.flag}
                                      </span>
                                    </div>
                                  </div>
                                  <FlaskConical size={14} className="text-slate-200" />
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 p-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                Processing_Required_For_Results
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-black/5 bg-white/40 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="glass-button px-8"
          >
            Dismiss History
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientHistory;
