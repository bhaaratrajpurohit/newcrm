const { useState, useEffect, useRef, useMemo } = React;
const { motion, AnimatePresence } = window.Motion || { motion: { div: 'div' }, animate: {} };
const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } = window.Recharts;

/**
 * 💎 ICON WRAPPER (Lucide Integration)
 */
const Icon = ({ name, size = 20, className = "", color = "currentColor" }) => {
    const iconRef = useRef(null);
    useEffect(() => {
        if (window.lucide && iconRef.current) {
            window.lucide.createIcons({
                icons: { [name]: window.lucide.icons[name] },
                attrs: { stroke: color, 'stroke-width': 2, width: size, height: size, class: className }
            });
        }
    }, [name, size, color, className]);
    return <i ref={iconRef} data-lucide={name} className={className} style={{ width: size, height: size, display: 'inline-block' }} />;
};

const STORAGE_KEYS = { ACCOUNTS: 'crm_fleet_acc', LOGS: 'crm_fleet_logs', WEBHOOK: 'crm_fleet_hook', BATCHES: 'crm_fleet_batches' };

const App = () => {
    const [tab, setTab] = useState('hub');
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [batches, setBatches] = useState([]);
    const [webhook, setWebhook] = useState(localStorage.getItem(STORAGE_KEYS.WEBHOOK) || '');
    const [showImport, setShowImport] = useState(false);
    const [tempBatch, setTempBatch] = useState({ name: '', leads: [] });

    // --- DATA INITIALIZATION ---
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (!stored) {
            const initial = window.CRM_ACCOUNTS.map(a => ({ ...a, health: 98, sent: 0, status: 'active', id: Math.random().toString(36).substr(2, 9) }));
            localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(initial));
            setAccounts(initial);
        } else {
            setAccounts(JSON.parse(stored));
        }

        const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
        if (storedLogs) setLogs(JSON.parse(storedLogs));

        const storedBatches = localStorage.getItem(STORAGE_KEYS.BATCHES);
        if (storedBatches) setBatches(JSON.parse(storedBatches));
    }, []);

    const saveWebhook = (url) => {
        setWebhook(url);
        localStorage.setItem(STORAGE_KEYS.WEBHOOK, url);
    };

    const handleSend = async (batch) => {
        if (!webhook) return alert('CRITICAL: Webhook URL missing. Please set it in Settings.');

        try {
            const res = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batchName: batch.name,
                    leads: batch.leads,
                    accounts: accounts.slice(0, 3), // Example: sending first 3 accounts
                    timestamp: new Date().toISOString()
                })
            });

            if (res.ok) {
                alert('TRANSMISSION SUCCESS: n8n workflow triggered.');
                const updated = batches.map(b => b.id === batch.id ? { ...b, status: 'sent' } : b);
                setBatches(updated);
                localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(updated));

                // Log the activity
                const newLog = { id: Date.now(), type: 'transmission', message: `Bulk outreach started for ${batch.name}`, timestamp: new Date().toLocaleTimeString() };
                const updatedLogs = [newLog, ...logs];
                setLogs(updatedLogs);
                localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
            } else {
                alert(`API ERROR: ${res.statusText}`);
            }
        } catch (e) {
            alert('NETWORK ERROR: Could not connect to n8n gateway.');
        }
    };

    const onFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const lines = ev.target.result.split('\n').filter(l => l.trim());
            const leads = lines.slice(1).map(l => {
                const parts = l.split(',');
                return { email: parts[0]?.trim(), name: parts[1]?.trim() || 'Prospect' };
            }).filter(l => l.email && l.email.includes('@'));

            setTempBatch({ name: file.name, leads });
            setShowImport(true);
        };
        reader.readAsText(file);
    };

    const commitImport = () => {
        const newBatch = { ...tempBatch, id: Date.now(), status: 'ready', timestamp: new Date().toLocaleDateString() };
        const updated = [newBatch, ...batches];
        setBatches(updated);
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(updated));
        setShowImport(false);
    };

    // --- COMPONENTS ---
    const SidebarItem = ({ id, label, icon }) => (
        <button
            onClick={() => setTab(id)}
            className={`flex items-center gap-4 w-full px-6 py-4 rounded-2xl font-black text-sm transition-all ${tab === id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-500 hover:bg-white hover:text-slate-900 group'}`}
        >
            <Icon name={icon} color={tab === id ? 'white' : '#64748B'} className={tab === id ? "" : "group-hover:stroke-slate-900 transition-colors"} />
            {label}
        </button>
    );

    return (
        <div className="flex min-h-screen">
            {/* SIDEBAR */}
            <aside className="w-80 h-screen bg-slate-50 border-r border-slate-200 p-8 flex flex-col sticky top-0 z-20">
                <div className="flex items-center gap-4 mb-14 px-2">
                    <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-200">
                        <Icon name="Zap" color="white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">ColdFlow</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Production v2.5</p>
                    </div>
                </div>
                <nav className="space-y-3 flex-1">
                    <SidebarItem id="hub" label="Dashboard" icon="LayoutDashboard" />
                    <SidebarItem id="fleet" label="Fleet Registry" icon="Shield" />
                    <SidebarItem id="leads" label="Lead Center" icon="UserPlus" />
                    <SidebarItem id="stream" label="Activity Stream" icon="Activity" />
                    <SidebarItem id="settings" label="Settings" icon="Settings" />
                </nav>
                <div className="mt-auto px-4 py-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SYSTEM STATUS</p>
                    <p className="text-sm font-black text-green-600 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> OPTIMAL
                    </p>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 bg-white p-12 overflow-y-auto relative z-10">
                {tab === 'hub' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mesh-bg py-4">
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-12">Performance Hub</h2>
                        <div className="grid grid-cols-4 gap-8 mb-16">
                            {[
                                { l: 'Leads Ready', v: batches.reduce((acc, b) => acc + (b.status === 'ready' ? b.leads.length : 0), 0), c: '#3B82F6', i: 'Users' },
                                { l: 'Active Fleet', v: `${accounts.length}/20`, c: '#10B981', i: 'Shield' },
                                { l: 'Sent Total', v: accounts.reduce((acc, a) => acc + a.sent, 0), c: '#F59E0B', i: 'Send' },
                                { l: 'Success Rate', v: '98.4%', c: '#8B5CF6', i: 'TrendingUp' }
                            ].map((m, i) => (
                                <div key={i} className="p-8 rounded-[44px] bg-slate-50 border border-slate-100 hover:scale-105 transition-all shadow-sm shadow-premium">
                                    <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                                        <Icon name={m.i} color={m.c} size={32} />
                                    </div>
                                    <p className="text-4xl font-black text-slate-900">{m.v}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{m.l}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-900 rounded-[64px] p-16 h-[500px] relative overflow-hidden shadow-2xl shadow-premium">
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Transmission Pulse</h3>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Global Outreach Activity</p>
                            <div className="absolute inset-x-12 bottom-0 top-48">
                                <ResponsiveContainer width="100%" height="90%">
                                    <AreaChart data={[{ n: 'Mon', v: 10 }, { n: 'Tue', v: 45 }, { n: 'Wed', v: 35 }, { n: 'Thu', v: 85 }, { n: 'Fri', v: 65 }]}>
                                        <defs>
                                            <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={6} fill="url(#colorV)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}

                {tab === 'fleet' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-12">Fleet Registry</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                            {accounts.map((a, i) => (
                                <div key={i} className="p-10 rounded-[48px] border-2 border-slate-50 bg-slate-50/50 hover:bg-white hover:shadow-premium transition-all group card-hover">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                                            <Icon name="Mail" color="#3B82F6" size={32} />
                                        </div>
                                        <div className="px-5 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black border border-green-100 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> ONLINE
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 truncate mb-1">{a.email}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-10">Client ID: {a.client_id.slice(0, 12)}...</p>
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 mb-1">HEALTH</p>
                                            <p className="text-xl font-black text-blue-600">{a.health}%</p>
                                        </div>
                                        <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 mb-1">SENT</p>
                                            <p className="text-xl font-black text-slate-900 font-mono">{a.sent}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {tab === 'leads' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex justify-between items-end mb-16">
                            <div>
                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Lead Center</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase mt-2">Campaign Intelligence Hub</p>
                            </div>
                            <label className="h-16 px-8 bg-blue-600 text-white rounded-[24px] font-black text-sm flex items-center gap-3 cursor-pointer shadow-2xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all tracking-widest uppercase">
                                <Icon name="Upload" size={18} color="white" /> Import Target CSV
                                <input type="file" accept=".csv" onChange={onFileImport} className="hidden" />
                            </label>
                        </div>
                        <div className="bg-slate-50 rounded-[48px] overflow-hidden border border-slate-100 shadow-inner p-1">
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Archive Name</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Payload Size</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Commit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white rounded-[44px]">
                                    {batches.length === 0 ? (
                                        <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-black uppercase tracking-widest opacity-50">Archive Base Empty</td></tr>
                                    ) : (
                                        batches.map((b, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                                                <td className="px-10 py-10">
                                                    <p className="font-black text-slate-900 text-lg mb-1">{b.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Imported: {b.timestamp}</p>
                                                </td>
                                                <td className="px-10 py-10 font-bold text-slate-500">{b.leads.length} Signals</td>
                                                <td className="px-10 py-10">
                                                    <span className={`px-5 py-2 rounded-full text-[10px] font-black border ${b.status === 'sent' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {b.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-10 text-right">
                                                    <button
                                                        onClick={() => handleSend(b)}
                                                        disabled={b.status === 'sent'}
                                                        className={`px-8 py-4 ${b.status === 'sent' ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:scale-105 shadow-xl'} rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95`}
                                                    >
                                                        {b.status === 'sent' ? 'Transmission Complete' : 'Trigger outreach'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {tab === 'stream' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-12">Activity Stream</h2>
                        <div className="space-y-6">
                            {logs.length === 0 ? (
                                <div className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">No Stream activity detected</div>
                            ) : (
                                logs.map((l, i) => (
                                    <div key={i} className="flex items-center gap-8 p-8 bg-slate-50 border border-slate-100 rounded-[32px] hover:bg-white transition-all shadow-sm">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Icon name={l.type === 'transmission' ? 'Send' : 'Zap'} size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-900 font-black">{l.message}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Status: OK • Timestamp: {l.timestamp}</p>
                                        </div>
                                        <div className="px-5 py-2 bg-white rounded-full border border-slate-100 text-[10px] font-black text-slate-500 tracking-widest">LIVE</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {tab === 'settings' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl bg-slate-50/50 p-16 rounded-[64px] border-2 border-slate-50">
                        <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center mb-10 shadow-2xl">
                            <Icon name="Settings" color="white" size={40} />
                        </div>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Command Center</h2>
                        <p className="text-slate-400 font-bold mb-16 uppercase tracking-widest text-xs">Bridge your CRM with n8n via Webhook</p>

                        <div className="space-y-12">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Automation Gateway (Webhook URL)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={webhook}
                                        onChange={(e) => setWebhook(e.target.value)}
                                        className="w-full h-24 bg-white border-2 border-slate-100 rounded-[36px] px-12 font-bold text-slate-900 focus:border-blue-500 outline-none transition-all shadow-inner text-lg"
                                        placeholder="https://primary-n8n.udaanxai.online/webhook/..."
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black text-slate-400 tracking-widest border border-slate-100">ACTIVE</div>
                                </div>
                            </div>
                            <button
                                onClick={() => saveWebhook(webhook)}
                                className="w-full h-24 bg-blue-600 text-white rounded-[40px] font-black uppercase tracking-[0.2em] text-[15px] shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Commit Integration Changes
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* MODALS */}
            <AnimatePresence>
                {showImport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImport(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-3xl" />
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative bg-white rounded-[80px] w-full max-w-xl p-20 shadow-2xl border border-slate-100 overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Icon name="Inbox" size={300} />
                            </div>
                            <div className="relative">
                                <div className="w-24 h-24 bg-blue-600 rounded-[36px] flex items-center justify-center mb-10 shadow-2xl shadow-blue-200">
                                    <Icon name="Database" color="white" size={44} />
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Payload Scanned</h3>
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-16">{tempBatch.leads.length} Target Leads detected in {tempBatch.name}</p>
                                <div className="flex flex-col gap-6">
                                    <button onClick={commitImport} className="h-24 bg-blue-600 text-white rounded-[36px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">Ingest into Lead Center</button>
                                    <button onClick={() => setShowImport(false)} className="h-16 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">Discard Sequence</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- RENDER ENGINE ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
