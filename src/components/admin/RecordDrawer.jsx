// src/components/admin/RecordDrawer.jsx
// Right-side slide-in panel for inspecting a full record (a lead's podcast
// link, notes, etc. don't belong in a table cell). Sharp edges, HUD header,
// Escape / backdrop to close. Children own the body layout.
import gsap from "gsap";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { prefersReduced } from "./adminUtils";

export default function RecordDrawer({ open, title, eyebrow = "Record", onClose, children }) {
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open || !panelRef.current) return;
        if (!prefersReduced()) {
            gsap.fromTo(
                panelRef.current,
                { xPercent: 100 },
                { xPercent: 0, duration: 0.4, ease: "power4.out" },
            );
        }
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-90" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={panelRef}
                className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border-subtle bg-surface-raised shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.7)]"
            >
                <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-orange">
                            {eyebrow}
                        </p>
                        <h2 className="mt-1 text-lg font-bold tracking-tight text-content">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close panel"
                        className="grid h-9 w-9 place-items-center border border-border-subtle text-content-muted transition-colors hover:border-brand-orange hover:text-brand-orange"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            </div>
        </div>
    );
}

/** Labelled field row for drawer bodies. */
export function DrawerField({ label, children }) {
    return (
        <div className="border-b border-border-subtle py-4 first:pt-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-content-muted">
                {label}
            </p>
            <div className="mt-1.5 text-sm font-semibold wrap-break-word text-content">{children}</div>
        </div>
    );
}
