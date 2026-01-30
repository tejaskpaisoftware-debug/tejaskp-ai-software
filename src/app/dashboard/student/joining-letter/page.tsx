"use client";

import { formatDistanceStrict } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import JoiningLetterTemplate from "@/components/documents/JoiningLetterTemplate";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export default function StudentJoiningLetterPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);
    const [letterData, setLetterData] = useState<any>(null);
    // ... existing state ...

    // ... existing fetchLetter ...

    // ... existing formatDate ...

    // ... existing handleDownload ...

    // ... existing logging/loading checks ...

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="flex justify-between items-center mb-8 max-w-[1000px] mx-auto">
                {/* ... existing header ... */}
            </header>

            <div className="flex justify-center overflow-auto pb-20">
                <div className="transform scale-90 origin-top">
                    <JoiningLetterTemplate
                        ref={letterRef}
                        formData={letterData}
                        formatDate={formatDate}
                        duration={(() => {
                            if (!letterData?.startDate || !letterData?.endDate) return "6 Months";
                            try {
                                const start = new Date(letterData.startDate);
                                const end = new Date(letterData.endDate);
                                // Use date-fns to match Admin logic exactly
                                const duration = formatDistanceStrict(start, end);
                                // Capitalize first letter (e.g. "3 months" -> "3 Months")
                                return duration.charAt(0).toUpperCase() + duration.slice(1);
                            } catch (e) { return "6 Months"; }
                        })()}
                    />
                </div>
            </div>
        </div>
    );
}
