// src/components/admin/ConfirmDialog.jsx
// Destructive-action modal. Console framing (HUD corner + tracked caps), sharp
// edges, Escape / backdrop to dismiss, async-aware confirm button. Renders
// nothing when closed.
import gsap from "gsap";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { prefersReduced } from "./adminUtils";

export default function ConfirmDialog({
    open,
    title = "Confirm deletion",
    message = "This action cannot be undone.",
    confirmLabel = "Delete",
    onConfirm,
    onClose,
}) {
    const panelRef = useRef(null);
    const cancelRef = useRef(null);
    const [busy, setBusy] = useState(false);

    // Focus + entrance
    useEffect(() => {
        if (!open) return;
        cancelRef.current?.focus();
        if (prefersReduced() || !panelRef.current) return;
        gsap.fromTo(
            panelRef.current,
            { opacity: 0, y: 14, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "power3.out" },
        );
    }, [open]);

    // Escape to close
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && !busy && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, busy, onClose]);

    if (!open) return null;

    const handleConfirm = async () => {
        try {
            setBusy(true);
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
        >
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => !busy && onClose()}
            />
            <div
                ref={panelRef}
                className="relative w-full max-w-md border border-border-subtle bg-surface-raised shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            >
                {/* HUD strip */}
                <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-rose-400">
                        <AlertTriangle size={13} />
                        Danger
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-content-muted">
                        ⌫ irreversible
                    </span>
                </div>

                <div className="px-5 py-6">
                    <h2
                        id="confirm-title"
                        className="font-serif text-xl font-black tracking-tight text-content"
                    >
                        {title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-content-muted">{message}</p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-5 py-4">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="border border-border-subtle px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-content transition-colors hover:border-content disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={busy}
                        className="inline-flex items-center gap-2 bg-rose-500 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-rose-600 disabled:opacity-60"
                    >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
