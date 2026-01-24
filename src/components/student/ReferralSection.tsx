"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, TrendingUp, DollarSign, Wallet } from "lucide-react";

export default function ReferralSection({ userId }: { userId: string }) {
    const [stats, setStats] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [referralMessage, setReferralMessage] = useState<{ type: string, text: string } | null>(null);

    useEffect(() => {
        fetchStats();
        fetchProjects();
    }, []);

    const [error, setError] = useState<string | null>(null);

    const getAuthHeader = (): HeadersInit => {
        const userStr = sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.token) return { 'Authorization': `Bearer ${user.token}` };
            } catch (e) { console.error("Error parsing user for auth", e); }
        }
        return {};
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/student/referrals/stats', {
                headers: { ...getAuthHeader() }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data);
            } else {
                setError(data.error || "Failed to load");
            }
        } catch (e) {
            console.error(e);
            setError("Network Error");
        }
    };

    const fetchProjects = async () => {
        try {
            // Public route, but good practice to send auth if available, check backend requirement
            // Assuming strict public for now based on name, but let's be safe if mixed
            const res = await fetch('/api/public/projects');
            const data = await res.json();
            if (data.success) setProjects(data.projects);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCopyCode = () => {
        if (stats?.referralCode) {
            navigator.clipboard.writeText(stats.referralCode);
            alert("Referral Code Copied!");
        }
    };

    const handleReferProject = async (projectId: string, title: string) => {
        const clientName = prompt(`Enter Client Name for "${title}":`);
        if (!clientName) return;
        const clientMobile = prompt("Enter Client Mobile Number:");
        if (!clientMobile) return;

        try {
            const res = await fetch('/api/student/referrals/project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({ projectId, clientName, clientMobile })
            });
            const data = await res.json();
            if (data.success) {
                alert("Referral Submitted Successfully!");
                fetchStats();
            } else {
                alert("Failed: " + data.error);
            }
        } catch (e) {
            alert("Something went wrong");
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            {/* Hero & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gold-600 to-gold-400 p-6 rounded-2xl text-obsidian shadow-lg">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Wallet size={24} /> Your Wallet Balance
                    </h3>
                    <div className="text-4xl font-extrabold mb-4">₹{stats?.walletBalance?.toLocaleString() || 0}</div>
                    <div className="flex gap-4 text-sm font-semibold opacity-80">
                        <span>Total Earned: ₹{stats?.totalEarnings || 0}</span>
                        <span>Pending: ₹{stats?.pendingEarnings || 0}</span>
                    </div>
                </div>

                <div className="bg-charcoal/40 border border-gold-500/20 p-6 rounded-2xl">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-4">Your Referral Code</h3>
                    <div className="flex items-center gap-4 bg-obsidian p-4 rounded-xl border border-gold-500/30">
                        <code className="text-2xl font-mono text-gold-400 tracking-wider flex-1 text-center">
                            {error ? <span className="text-red-400 text-sm">{error}</span> : (stats?.referralCode || "Loading...")}
                        </code>
                        <button onClick={handleCopyCode} className="p-2 hover:bg-gold-500/20 rounded-full text-gold-500 transition-colors">
                            <Copy size={20} />
                        </button>
                    </div>

                    {/* Refer Student Button */}
                    <button
                        onClick={async () => {
                            const name = prompt("Enter Student Name:");
                            if (!name) return;
                            const mobile = prompt("Enter Student Mobile Number:");
                            if (!mobile) return;

                            try {
                                const res = await fetch('/api/student/referrals/lead', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...getAuthHeader()
                                    },
                                    body: JSON.stringify({ studentName: name, studentMobile: mobile })
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert('Student Referral Submitted! Earn ₹50 when they enroll.');
                                    fetchStats();
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (e) { alert('Failed to submit'); }
                        }}
                        className="w-full mt-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">🎓</span> Refer a Friend (Earn ₹50)
                    </button>

                    {/* Incentive Highlight */}
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-lg flex items-start gap-3">
                        <span className="text-xl">💰</span>
                        <div className="text-xs text-yellow-200">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Earn <span className="text-white font-bold">₹50</span> instantly for every student enrollment.</li>
                                <li>Earn <span className="text-white font-bold">5% Commission</span> on every project referral.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Internship Domains Ticker/List */}
            <div className="bg-charcoal/40 border border-white/5 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Available Internship Domains for Referral:
                </h4>
                <div className="flex flex-wrap gap-2">
                    {["Web Development", "Mobile Application", "Data Analyst", "Cyber Security", "Digital Marketing", "Cloud Computing", "UI/UX Design", "Game Development", "AI / ML"].map((domain) => (
                        <span key={domain} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-gold-500/10 hover:border-gold-500/30 transition-colors cursor-default">
                            {domain}
                        </span>
                    ))}
                </div>
            </div>

            {/* Project Discovery */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="text-gold-500" /> Discover Projects
                </h2>
                <p className="text-gray-400 mb-6">Refer clients and earn <span className="text-green-400 font-bold">5% Commission</span> on every successful project!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <motion.div
                            key={project.id}
                            whileHover={{ y: -5 }}
                            className="bg-charcoal/40 border border-gold-500/10 p-6 rounded-xl hover:border-gold-500/30 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-bold bg-white/10 text-gold-400 px-2 py-1 rounded uppercase tracking-wider">{project.category}</span>
                                <span className="text-green-400 font-bold text-sm">{project.commissionRate}% Comm.</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{project.description}</p>
                            <button
                                onClick={() => handleReferProject(project.id, project.title)}
                                className="w-full py-3 rounded-lg bg-gold-500 text-obsidian font-bold hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <Share2 size={16} /> Refer This Project
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* History Table */}
            <div>
                <h2 className="text-xl font-bold text-white mb-6">Referral History</h2>
                <div className="bg-charcoal/40 border border-gold-500/20 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-white/5 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                            {stats?.history?.map((ref: any) => (
                                <tr key={ref.id} className="hover:bg-white/5">
                                    <td className="p-4">{new Date(ref.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold text-white">{ref.type}</td>
                                    <td className="p-4 max-w-[200px] truncate">{ref.description || (ref.type === 'ENROLLMENT' ? 'New Student Enrollment' : '-')}</td>
                                    <td className="p-4 text-right">₹{ref.amount}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${ref.status === 'APPROVED' || ref.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                                            ref.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {ref.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!stats?.history || stats.history.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No referrals yet. Start sharing!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
