"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { motion } from "framer-motion";

type Role = "STUDENT" | "EMPLOYEE" | "CLIENT";

export default function RegisterUserPage() {
    const [formData, setFormData] = useState({
        role: "STUDENT" as Role,
        fullName: "",
        mobile: "",
        email: "",
        address: "",
        details: "",
        joiningDate: new Date().toISOString().split('T')[0]
    });
    const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

    // College Search Logic
    const [colleges, setColleges] = useState<string[]>([]);
    const [collegeSearch, setCollegeSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    // Fallback Data - Comprehensive List of Gujarat Colleges & Universities
    const FALLBACK_COLLEGES = [
        // Universities
        "Gujarat University",
        "Gujarat Technological University (GTU)",
        "Indian Institute of Management Ahmedabad (IIMA)",
        "Indian Institute of Technology Gandhinagar (IITGN)",
        "Nirma University",
        "Pandit Deendayal Energy University (PDEU)",
        "DA-IICT",
        "Sardar Vallabhbhai National Institute of Technology (SVNIT)",
        "Parul University",
        "Marwadi University",
        "RK University, Rajkot",
        "Saurashtra University",
        "Maharaja Sayajirao University of Baroda (MSU)",
        "Veer Narmad South Gujarat University",
        "Ahmedabad University",
        "Indus University",
        "Silver Oak University",
        "Charotar University of Science and Technology (CHARUSAT)",
        "Ganpat University",
        "Navrachana University",
        "AURO University, Surat",
        "Dharmsinh Desai University",
        "CEPT University",
        "Institute of Infrastructure Technology Research and Management (IITRAM)",
        "Rai University",
        "GLS University",
        "Karnavati University",
        "Swarrnim Startup & Innovation University",
        "ITM (SLS) Baroda University",
        "C. U. Shah University, Wadhwan",
        "Uka Tarsadia University, Bardoli",
        "P. P. Savani University",
        "Atmiya University",
        "Darshan University",
        "Gokul Global University",
        "Sankalchand Patel University",
        "Hemchandracharya North Gujarat University (HNGU)",
        "Bhakta Kavi Narsinh Mehta University (BKNMU)",
        "Shri Govind Guru University",
        "Children's University",
        "Raksha Shakti University",
        "Dr. Babasaheb Ambedkar Open University",

        // Engineering Colleges (Government)
        "L. D. College of Engineering (LDCE), Ahmedabad",
        "Vishwakarma Government Engineering College (VGEC), Chandkheda",
        "Government Engineering College (GEC), Gandhinagar",
        "Government Engineering College (GEC), Rajkot",
        "Government Engineering College (GEC), Bhavnagar",
        "Government Engineering College (GEC), Patan",
        "Government Engineering College (GEC), Dahod",
        "Government Engineering College (GEC), Bharuch",
        "Government Engineering College (GEC), Surat",
        "Government Engineering College (GEC), Valkas",
        "Government Engineering College (GEC), Modasa",
        "Government Engineering College (GEC), Bhuj",
        "Shantilal Shah Engineering College, Bhavnagar",
        "Dr. S. & S. S. Ghandhy Government Engineering College, Surat",
        "Lukhdhirji Engineering College, Morbi",

        // Engineering Colleges (Private/SFI)
        "Adani Institute of Infrastructure Engineering (AIIE)",
        "L. J. Institute of Engineering and Technology (LJIET)",
        "Sal Institute of Technology and Engineering Research",
        "Silver Oak College of Engineering and Technology (SOCET)",
        "Aditya Silver Oak Institute of Technology (ASOIT)",
        "Babaria Institute of Technology (BITS), Vadodara",
        "Vadodara Institute of Engineering (VIER)",
        "Sigma Institute of Engineering",
        "Parul Institute of Engineering and Technology",
        "Sarvajanik College of Engineering and Technology (SCET), Surat",
        "CK Pithawalla College of Engineering and Technology",
        "Bhagwan Arihant Institute of Technology",
        "V. V. P. Engineering College, Rajkot",
        "Atmiya Institute of Technology and Science",
        "Darshan Institute of Engineering and Technology",
        "Marwadi Education Foundation Group of Institutions",
        "RK College of Engineering",
        "G. H. Patel College of Engineering and Technology (GCET)",
        "Birla Vishvakarma Mahavidyalaya (BVM)",
        "A. D. Patel Institute of Technology (ADIT)",
        "Madhuben and Bhanubhai Patel Institute of Technology (MBIT)",
        "Chhotubhai Gopalbhai Patel Institute of Technology",

        // Pharmacy & Others
        "L. M. College of Pharmacy",
        "B. K. School of Business Management",
        "Som-Lalit Institute of Business Management",
        "H. L. College of Commerce",
        "H. A. College of Commerce",
        "St. Xavier's College, Ahmedabad",
        "M. G. Science Institute",
        "R. J. Tibrewal Commerce College",
        "K. S. School of Business Management"
    ];

    // Fetch Colleges on Mount
    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const res = await fetch("https://universities.hipolabs.com/search?country=India");
                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();

                // Determine unique names
                let names = Array.from(new Set(data.map((c: any) => c.name))).sort();

                // Prioritize Gujarat Colleges
                const gujaratColleges = names.filter(n => (n as string).toLowerCase().includes("gujarat") || (n as string).toLowerCase().includes("ahmedabad") || (n as string).toLowerCase().includes("vadodara") || (n as string).toLowerCase().includes("surat"));
                const otherColleges = names.filter(n => !(n as string).toLowerCase().includes("gujarat") && !(n as string).toLowerCase().includes("ahmedabad") && !(n as string).toLowerCase().includes("vadodara") && !(n as string).toLowerCase().includes("surat"));

                setColleges([...gujaratColleges, ...otherColleges] as string[]);
            } catch (err) {
                console.warn("Using fallback college list due to API error.");
                setColleges(FALLBACK_COLLEGES.sort());
            }
        };

        fetchColleges();
    }, []);

    const filteredColleges = colleges.filter(c =>
        c.toLowerCase().includes(collegeSearch.toLowerCase())
    ).slice(0, 50); // Increased limit

    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("IDLE");
        setErrorMessage("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus("SUCCESS");
                setFormData({ ...formData, fullName: "", mobile: "", email: "", address: "", details: "", joiningDate: new Date().toISOString().split('T')[0] });
                setCollegeSearch("");
                setTimeout(() => setStatus("IDLE"), 3000);
            } else {
                const data = await res.json();
                setErrorMessage(data.message || "Registration Failed");
                setStatus("ERROR");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Network Error. Please try again.");
            setStatus("ERROR");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pl-64">
            <AdminSidebar />

            <main className="p-8 max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-foreground tracking-widest">REGISTER NEW USER</h1>
                    <p className="text-gold-theme/60 mt-1">Create accounts for Students, Employees, or Clients.</p>
                </header>

                <div className="bg-card/40 border border-theme rounded-2xl p-8 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Role Selection */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {["STUDENT", "EMPLOYEE", "CLIENT"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role as Role })}
                                    className={`py-3 rounded-lg text-sm font-bold tracking-wider transition-all border ${formData.role === role
                                        ? "bg-gold-theme text-black border-gold-theme"
                                        : "bg-transparent text-muted-foreground border-theme hover:border-gold-theme/50"
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-background border border-gold-theme/30 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme transition-all"
                                    placeholder="e.g. Rahul Verma"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider">Mobile Number</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full bg-background border border-gold-theme/30 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme transition-all"
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider">Email (Compulsory)</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-background border border-gold-theme/30 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme transition-all"
                                placeholder="e.g. rahul@example.com"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider">
                                {formData.role === "STUDENT" ? "College / Institute Details" : "Address / Details"}
                            </label>

                            {formData.role === "STUDENT" ? (
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={formData.address || collegeSearch}
                                        onChange={(e) => {
                                            setFormData({ ...formData, address: e.target.value });
                                            setCollegeSearch(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onClick={() => setShowDropdown(true)}
                                        onFocus={() => setShowDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                        className="w-full bg-background border border-gold-theme/30 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme transition-all placeholder-gray-500 pr-10"
                                        placeholder="Search or Select College..."
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-theme pointer-events-none">
                                        ▼
                                    </div>

                                    {showDropdown && filteredColleges.length > 0 && (
                                        <div
                                            style={{ backgroundColor: 'var(--background)' }}
                                            className="absolute top-full left-0 right-0 border border-gold-theme/30 rounded-lg mt-1 max-h-60 overflow-y-auto z-[100] shadow-xl scrollbar-thin scrollbar-thumb-gold-theme/20"
                                        >
                                            {filteredColleges.map((college, i) => (
                                                <div
                                                    key={i}
                                                    className="px-4 py-3 hover:bg-gold-theme/10 text-sm text-foreground cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                                    onMouseDown={() => {
                                                        // use onMouseDown to fire before onBlur
                                                        setFormData({ ...formData, address: college });
                                                        setCollegeSearch(college);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    {college}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <textarea
                                    rows={3}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-background border border-gold-theme/30 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme transition-all"
                                    placeholder="Enter address or ID proof details..."
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gold-theme/80 uppercase tracking-wider">Date of Joining</label>
                            <input
                                type="date"
                                value={formData.joiningDate}
                                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                style={{ colorScheme: 'dark' }}
                                className="w-full bg-background border border-gold-theme/30 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-gold-theme transition-all"
                            />
                        </div>

                        {status === "SUCCESS" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg text-center font-bold"
                            >
                                User Registered Successfully! <br />
                                <span className="text-xs font-normal text-gray-300">Status is PENDING. Go to 'System Logs' to Approve.</span>
                            </motion.div>
                        )}

                        {status === "ERROR" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg text-center font-bold"
                            >
                                ⚠️ {errorMessage}
                            </motion.div>
                        )}

                        <button className="w-full bg-gradient-to-r from-gold-theme to-gold-theme/80 text-black font-bold py-4 rounded-lg shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-[1.01] transition-all">
                            REGISTER USER
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
