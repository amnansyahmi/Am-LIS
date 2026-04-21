import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Patient, Test, UserProfile } from '../types';
import { 
  Plus, 
  Search, 
  Clock, 
  Beaker,
  CheckCircle2,
  Activity,
  Eye,
  User,
  Info,
  X,
  Printer,
  Barcode,
  Stethoscope,
  ChevronRight,
  Milestone,
  Zap
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import SpecimenJourney from './SpecimenJourney';
import BarcodeLabel from './BarcodeLabel';

const OrderManager: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'journey'>('details');
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<'Routine' | 'STAT' | 'Urgent'>('Routine');
  const [referringDoc, setReferringDoc] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnap = await getDocs(ordersQ);
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));

      const patientsSnap = await getDocs(collection(db, 'patients'));
      setPatients(patientsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));

      const testsSnap = await getDocs(collection(db, 'tests'));
      setTests(testsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Test)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || selectedTests.length === 0) return;

    try {
      const orderData = {
        patientId: selectedPatientId,
        patientName: patients.find(p => p.id === selectedPatientId)?.name,
        status: 'Pending' as const,
        orderedBy: profile?.uid || 'Unknown',
        referringDoc,
        priority,
        createdAt: new Date().toISOString(),
        testIds: selectedTests
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      for (const tId of selectedTests) {
        await addDoc(collection(db, 'results'), {
          orderId: orderRef.id,
          testId: tId,
          testName: tests.find(t => t.id === tId)?.name,
          value: '',
          flag: 'Normal',
          technicianId: '',
          updatedAt: new Date().toISOString()
        });
      }

      setShowOrderForm(false);
      setSelectedTests([]);
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: any) => {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { status: newStatus });
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTest = (id: string) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Test Archive & Requests</h2>
        <button 
          onClick={() => setShowOrderForm(true)}
          className="glass-button flex items-center gap-2"
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass-panel p-12 text-center text-slate-400 font-semibold uppercase animate-pulse">Initializing_Test_Sync...</div>
        ) : orders.map((o) => (
          <div key={o.id} className="glass-card flex items-stretch">
            <div className="p-5 bg-white/20 border-r border-black/5 flex flex-col justify-center items-center gap-1 w-28 shrink-0">
              <span className="text-[10px] font-bold text-slate-400">UID</span>
              <span className="text-xs font-black text-slate-800 uppercase">{o.id.substring(0, 6)}</span>
            </div>
            
            <div className="p-6 flex-1 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 mb-1">{o.patientName || 'Clinical Subject'}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock size={12} /> {formatDate(o.createdAt)}
                  </span>
                  {o.priority && o.priority !== 'Routine' && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                      o.priority === 'STAT' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <Zap size={10} /> {o.priority}
                    </span>
                  )}
                  <span className={`status-pill ${
                    o.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    o.status === 'In-Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setViewingOrder(o)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-2"
                  title="View Details"
                >
                  <Eye size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Details</span>
                </button>

                <button 
                  onClick={() => alert('Initiating High-Resolution Label Printing Protocol...')}
                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all flex items-center gap-2"
                  title="Print Specimen Labels"
                >
                  <Printer size={18} />
                </button>

                {o.status === 'Pending' && (
                  <button 
                    onClick={() => updateStatus(o.id, 'Collected')}
                    className="px-4 py-2 bg-white/40 border border-white/60 hover:bg-white/60 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl flex items-center gap-2"
                  >
                    <Beaker size={14} /> Specimen Collected
                  </button>
                )}
                {o.status === 'Collected' && (
                  <button 
                    onClick={() => updateStatus(o.id, 'In-Progress')}
                    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl flex items-center gap-2"
                  >
                    <Activity size={14} /> Start Scans
                  </button>
                )}
                {o.status === 'Completed' && (
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <CheckCircle2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showOrderForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel !p-0 shadow-2xl"
            >
              <div className="glass-header !bg-white/40">DIAGNOSTIC_AUTHORIZATION</div>
              <div className="p-8">
                <form onSubmit={handleCreateOrder} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Identity Selection</label>
                    <select 
                      required
                      className="w-full bg-white/20 border border-black/5 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-sans"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                      <option value="">Select Target Subject...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id.substring(0, 6)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Clinical Priority</label>
                      <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full bg-white/20 border border-black/5 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="Routine">Routine</option>
                        <option value="Urgent">Urgent</option>
                        <option value="STAT">STAT [EMERGENCY]</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Referring Physician</label>
                      <input 
                        type="text"
                        value={referringDoc}
                        onChange={(e) => setReferringDoc(e.target.value)}
                        placeholder="Dr. Smith"
                        className="w-full bg-white/20 border border-black/5 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 ml-1">Analytical Profile (Select Scans)</label>
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border border-black/5 bg-white/10 rounded-2xl">
                      {tests.map(t => (
                        <label 
                          key={t.id} 
                          className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedTests.includes(t.id) 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                              : 'bg-white/40 border-white/60 hover:border-blue-500/30'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={selectedTests.includes(t.id)}
                            onChange={() => toggleTest(t.id)}
                          />
                          <div className="flex-1">
                            <p className="text-xs font-black tracking-tight leading-tight">{t.name}</p>
                            <p className={`text-[9px] mt-1 font-bold uppercase opacity-60`}>
                              {t.category}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-6 border-t border-black/5">
                    <button 
                      type="button" 
                      onClick={() => setShowOrderForm(false)}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit" 
                      disabled={selectedTests.length === 0 || !selectedPatientId}
                      className="glass-button"
                    >
                      Authorize Request
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {viewingOrder && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel !p-0 shadow-2xl relative"
            >
              <div className="glass-header !bg-white/40 flex justify-between items-center pr-4">
                <div className="flex bg-black/5 p-1 rounded-xl ml-4">
                  <button 
                    onClick={() => setModalTab('details')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'details' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Specifications
                  </button>
                  <button 
                    onClick={() => setModalTab('journey')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${modalTab === 'journey' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Specimen Journey
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setViewingOrder(null);
                    setModalTab('details');
                  }}
                  className="p-1 hover:text-slate-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {modalTab === 'details' ? (
                  <>
                    {/* Patient Info Section */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-blue-600" />
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Subject Information</h3>
                        </div>
                        <button 
                          onClick={() => window.print()}
                          className="text-[9px] font-black uppercase text-blue-600 hover:underline"
                        >
                          Print Label Sheet
                        </button>
                      </div>
                      {(() => {
                        const patient = patients.find(p => p.id === viewingOrder.patientId);
                        return (
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 grid grid-cols-2 gap-4 bg-white/20 p-6 rounded-2xl border border-black/5">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</p>
                                <p className="text-sm font-black text-slate-800">{patient?.name || viewingOrder.patientName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Patient UID</p>
                                <p className="text-[10px] font-mono text-slate-600">{viewingOrder.patientId}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gender / DOB</p>
                                <p className="text-xs font-semibold text-slate-600">{patient?.gender || 'N/A'} • {patient ? formatDate(patient.dob) : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Contact</p>
                                <p className="text-xs font-semibold text-slate-600">{patient?.contact || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center justify-center">
                              <BarcodeLabel 
                                value={`SPC-${viewingOrder.id.substring(0, 8).toUpperCase()}`} 
                                patientName={patient?.name || 'Subject'} 
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </section>

                    {/* Tests Section */}
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Info size={16} className="text-blue-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Included Diagnostics</h3>
                      </div>
                      <div className="space-y-3">
                        {viewingOrder.testIds?.map((tId, idx) => {
                          const test = tests.find(t => t.id === tId);
                          return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-xl">
                              <div>
                                <p className="text-xs font-black text-slate-800">{test?.name || 'Unknown Panel'}</p>
                                <p className="text-[9px] font-bold uppercase text-slate-400">{test?.category || 'General'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-mono text-slate-500">{test?.normalRange ? `Ref: ${test.normalRange}` : ''}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400">{test?.unit || ''}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </>
                ) : (
                  <SpecimenJourney status={viewingOrder.status} createdAt={viewingOrder.createdAt} />
                )}

                <div className="pt-6 border-t border-black/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black border border-black/5">AT</div>
                    <div>
                      <p className="text-[9px] font-black text-slate-900 uppercase">Authorized By</p>
                      <p className="text-[10px] text-slate-500">Dr. Aris Thorne</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setViewingOrder(null);
                      setModalTab('details');
                    }}
                    className="glass-button px-8"
                  >
                    Close Protocol
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManager;
