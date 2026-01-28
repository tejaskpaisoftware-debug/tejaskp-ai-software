"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, AlertCircle, CheckCircle, Lock, Camera, Upload, Loader2, RefreshCcw, X, Trash2 } from "lucide-react";

interface ProfileSectionProps {
    userId: string;
}

export default function ProfileSection({ userId }: ProfileSectionProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'rejected'>('none');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        mobile: "",
        currentAddress: "",
        emergencyContact: "",
        panCard: "",
        aadharCard: "",
        bankName: "",
        accountNo: "",
        ifsc: "",
        photoUrl: "",
    });

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            const data = await res.json();
            if (data.user) {
                const u = data.user;
                setUser(u);
                setFormData({
                    mobile: u.mobile || "",
                    currentAddress: u.currentAddress || "",
                    emergencyContact: u.emergencyContact || "",
                    panCard: u.panCard || "",
                    aadharCard: u.aadharCard || "",
                    bankName: u.bankDetails?.bankName || "",
                    accountNo: u.bankDetails?.accountNo || "",
                    ifsc: u.bankDetails?.ifsc || "",
                    photoUrl: u.photoUrl || "",
                });
                // Check if user has a pending request
                if (u.pendingUpdate) {
                    setRequestStatus('pending');
                } else {
                    setRequestStatus('none');
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchProfile();
    }, [userId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
            setIsCameraOpen(true);
        } catch (err) {
            alert("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
            stopCamera();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/employee/profile-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    updates: {
                        mobile: formData.mobile,
                        currentAddress: formData.currentAddress,
                        emergencyContact: formData.emergencyContact,
                        panCard: formData.panCard,
                        aadharCard: formData.aadharCard,
                        bankDetails: {
                            bankName: formData.bankName,
                            accountNo: formData.accountNo,
                            ifsc: formData.ifsc
                        },
                        photoUrl: formData.photoUrl
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                setRequestStatus('pending');
                setIsEditing(false);
                fetchProfile(); // Refresh
            } else {
                alert("Failed to submit request: " + data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gold-500 animate-pulse">Loading Profile...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">Profile not found</div>;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-orbitron">
                        My Profile
                    </h2>
                    <p className="text-gray-400 mt-1">Manage your personal and professional details</p>
                </div>
                {requestStatus === 'pending' && (
                    <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-500 animate-pulse">
                        <AlertCircle size={18} />
                        <span className="font-bold text-sm tracking-wide">APPROVAL PENDING</span>
                    </div>
                )}
            </div>

            {/* Profile Card */}
            <div className="glass-card-3d p-8 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    {/* Left: Avatar & Quick Actions */}
                    <div className="flex flex-col items-center space-y-4 w-full md:w-1/4">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full border-4 border-gold-500/30 overflow-hidden bg-black shadow-[0_0_40px_rgba(234,179,8,0.2)]">
                                <img
                                    src={formData.photoUrl || user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white font-orbitron">{user.name}</h3>
                            <p className="text-gold-400 font-bold uppercase tracking-widest text-sm mt-1">{user.role}</p>
                            <p className="text-gray-500 text-sm mt-1">{user.employeeId || "EMP-XXXX"}</p>
                        </div>

                        {!isEditing && requestStatus !== 'pending' && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-3 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold rounded-xl shadow-lg shadow-gold-500/20 hover:scale-105 transition-transform uppercase tracking-wider"
                            >
                                Edit Profile
                            </button>
                        )}
                        {requestStatus === 'pending' && (
                            <button
                                disabled
                                className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-xl border border-white/10 cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <Lock size={16} /> Changes Under Review
                            </button>
                        )}
                    </div>

                    {/* Right: Details Form */}
                    <form onSubmit={handleSubmit} className="flex-1 space-y-6">
                        {/* Section: Professional */}
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <h4 className="text-gold-400 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
                                <CheckCircle size={14} /> Professional Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold text-[10px] tracking-widest">Current Designation</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gold-500 font-bold flex items-center gap-2 cursor-not-allowed">
                                        <Lock size={12} className="opacity-50" /> {user.designation || "Not Assigned"}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Read only (Set by Admin)</p>
                                </div>
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold text-[10px] tracking-widest">Department</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white flex items-center gap-2 cursor-not-allowed">
                                        <Lock size={12} className="opacity-50" /> {user.department || "General"}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold text-[10px] tracking-widest">Reporting Manager</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white flex items-center gap-2 cursor-not-allowed">
                                        <Lock size={12} className="opacity-50" /> {user.reportingManager || "Management"}
                                    </div>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3 group mt-2">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold text-[10px] tracking-widest">Skills / Tech Stack</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white flex items-center gap-2 cursor-not-allowed">
                                        <Lock size={12} className="opacity-50" /> {user.skills || "Add skills via Admin"}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 italic uppercase tracking-tighter">Verified Professional Skills (Read Only)</p>
                                </div>
                            </div>
                        </div>

                        {/* Section: Personal & Contact */}
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <h4 className="text-blue-400 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
                                <CheckCircle size={14} /> Personal & Contact
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">Mobile Number</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500/50 outline-none disabled:opacity-50 transition-all"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">Current Address</label>
                                    <input
                                        type="text"
                                        name="currentAddress"
                                        value={formData.currentAddress}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500/50 outline-none disabled:opacity-50 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">Emergency Contact</label>
                                    <input
                                        type="text"
                                        name="emergencyContact"
                                        value={formData.emergencyContact}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500/50 outline-none disabled:opacity-50 transition-all"
                                        placeholder="Name, Relation, Phone"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Sensitive Docs (Admin Approval Required) */}
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden group/lock">
                            {/* Watermark/Icon using just CSS/SVG */}
                            <div className="absolute -right-8 -bottom-8 opacity-5 transform rotate-[-15deg] group-hover/lock:opacity-10 transition-opacity">
                                <Lock size={150} />
                            </div>

                            <h4 className="text-purple-400 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
                                <Lock size={14} /> Official Documents (Admin Approval)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">PAN Card Number</label>
                                    <input
                                        type="text"
                                        name="panCard"
                                        value={formData.panCard}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500/50 outline-none disabled:opacity-50 font-mono transition-all"
                                        placeholder="ABCDE1234F"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">Aadhar Number</label>
                                    <input
                                        type="text"
                                        name="aadharCard"
                                        value={formData.aadharCard}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500/50 outline-none disabled:opacity-50 font-mono transition-all"
                                        placeholder="XXXX-XXXX-XXXX"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500/50 outline-none disabled:opacity-50 transition-all"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">Account Number (Masked)</label>
                                    <input
                                        type="text"
                                        name="accountNo"
                                        value={formData.accountNo}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500/50 outline-none disabled:opacity-50 font-mono transition-all"
                                        placeholder="XXXXXXXX1234"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-xs text-gray-400 block mb-2 uppercase font-bold">IFSC Code</label>
                                    <input
                                        type="text"
                                        name="ifsc"
                                        value={formData.ifsc}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500/50 outline-none disabled:opacity-50 font-mono transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Photo Edit */}
                        {isEditing && (
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 animate-in slide-in-from-bottom-2">
                                <h4 className="text-gold-400 uppercase tracking-widest text-xs font-bold mb-6">Update Profile Photo</h4>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-gold-500/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-bold">Upload Photo</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">From your device</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="flex items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-blue-500/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                            <Camera size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-bold">Take Photo</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Using camera</div>
                                        </div>
                                    </button>
                                </div>

                                {formData.photoUrl && (
                                    <div className="mt-6 flex flex-col items-center">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Preview Selected Photo</p>
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full border-2 border-gold-500/50 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                                <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, photoUrl: "" }))}
                                                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-black hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Camera Modal */}
                        <AnimatePresence>
                            {isCameraOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
                                    >
                                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                            <h3 className="text-white font-bold flex items-center gap-2">
                                                <Camera size={18} className="text-gold-500" /> Capture Profile Photo
                                            </h3>
                                            <button onClick={stopCamera} className="text-gray-500 hover:text-white">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="aspect-square bg-black relative">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover mirror"
                                            />
                                            <div className="absolute inset-x-0 bottom-8 flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={capturePhoto}
                                                    className="w-16 h-16 rounded-full border-4 border-white bg-gold-500 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    <div className="w-12 h-12 rounded-full border-2 border-black/20" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-black/20 text-center">
                                            <p className="text-xs text-gray-400">Position your face in the center and click capture</p>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        {isEditing && (
                            <div className="flex gap-4 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); fetchProfile(); }}
                                    className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 uppercase tracking-widest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-[1.02] transition-transform uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} /> Submit for Approval
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {requestStatus === 'pending' && !isEditing && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="text-yellow-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-yellow-500 font-bold uppercase tracking-wider text-sm">Update Pending Approval</h4>
                                    <p className="text-gray-400 text-xs mt-1">
                                        You have submitted a profile update request. An administrator needs to review and approve these changes before they are reflected in your public profile and official records.
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
