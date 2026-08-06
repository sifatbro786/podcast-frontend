// src/components/admin/AdminSelect.jsx
// Compact accessible listbox — the dashboard's reusable version of the public
// TerminalSelect (same keyboard model + a11y roles, smaller footprint). Powers
// both the filter row and inline per-row status/role editing.
//
// options: (string | { value, label, disabled? })[]
// value:   current value ("" for the "all" case)
import gsap from "gsap";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { prefersReduced } from "./adminUtils";

export default function AdminSelect({
    value,
    onChange,
    options,
    placeholder = "Select…",
    label,
    size = "md", // "sm" (inline) | "md" (filter)
    align = "left", // dropdown edge to align to
    className = "",
    disabled = false,
}) {
    const uid = useId();
    const rootRef = useRef(null);
    const btnRef = useRef(null);
    const listRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [hi, setHi] = useState(-1);
    const [pos, setPos] = useState(null);

    const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
    const selectedIdx = opts.findIndex((o) => o.value === value);

    // Close on outside pointerdown (the list is portaled, so it's checked separately)
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (rootRef.current?.contains(e.target)) return;
            if (listRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener("pointerdown", onDoc);
        return () => document.removeEventListener("pointerdown", onDoc);
    }, [open]);

    // Track the trigger's viewport position so the portaled list can't get
    // clipped by a scrollable ancestor (e.g. DataTable's overflow-x-auto,
    // which forces overflow-y to "auto" too and cuts the list off).
    useEffect(() => {
        if (!open) return;
        const update = () => {
            const r = btnRef.current?.getBoundingClientRect();
            if (!r) return;
            setPos({
                top: r.bottom + 4,
                left: r.left,
                right: window.innerWidth - r.right,
                width: r.width,
            });
        };
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [open]);

    // Entrance micro-animation (guarded)
    useEffect(() => {
        if (!open || !listRef.current || prefersReduced()) return;
        gsap.fromTo(
            listRef.current,
            { opacity: 0, y: -6 },
            { opacity: 1, y: 0, duration: 0.2, ease: "power3.out" },
        );
        gsap.fromTo(
            listRef.current.children,
            { opacity: 0, x: -5 },
            { opacity: 1, x: 0, duration: 0.2, ease: "power3.out", stagger: 0.025 },
        );
    }, [open]);

    const openList = () => {
        setHi(selectedIdx >= 0 ? selectedIdx : 0);
        setOpen(true);
    };
    const pick = (idx) => {
        if (opts[idx].disabled) return;
        onChange(opts[idx].value);
        setOpen(false);
        btnRef.current?.focus();
    };

    const onKeyDown = (e) => {
        if (disabled) return;
        if (!open) {
            if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                openList();
            }
            return;
        }
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHi((h) => Math.min(h + 1, opts.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHi((h) => Math.max(h - 1, 0));
                break;
            case "Home":
                e.preventDefault();
                setHi(0);
                break;
            case "End":
                e.preventDefault();
                setHi(opts.length - 1);
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (hi >= 0) pick(hi);
                break;
            case "Escape":
                e.preventDefault();
                setOpen(false);
                btnRef.current?.focus();
                break;
            case "Tab":
                setOpen(false);
                break;
            default:
        }
    };

    const pad = size === "sm" ? "py-1.5 text-xs" : "py-2.5 text-sm";
    const selectedLabel = selectedIdx >= 0 ? opts[selectedIdx].label : placeholder;

    return (
        <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
            {label && (
                <label
                    id={`${uid}-label`}
                    className="mb-1 block text-[10px] font-medium uppercase tracking-[0.28em] text-content-muted"
                >
                    {label}
                </label>
            )}
            <button
                ref={btnRef}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-labelledby={label ? `${uid}-label` : undefined}
                aria-controls={`${uid}-list`}
                aria-activedescendant={open && hi >= 0 ? `${uid}-opt-${hi}` : undefined}
                disabled={disabled}
                onClick={() => (open ? setOpen(false) : openList())}
                className={`flex w-full items-center justify-between gap-2 border border-border-subtle bg-surface-raised px-3 font-medium text-content transition-colors duration-200 hover:border-brand-orange/60 disabled:cursor-not-allowed disabled:opacity-50 ${pad} ${
                    open ? "border-brand-orange" : ""
                }`}
            >
                <span className={selectedIdx >= 0 ? "text-content" : "text-content-muted/60"}>
                    {selectedLabel}
                </span>
                <ChevronDown
                    size={15}
                    className={`shrink-0 text-content-muted transition-transform duration-200 ${
                        open ? "rotate-180 text-brand-orange" : ""
                    }`}
                />
            </button>

            {open &&
                pos &&
                createPortal(
                    <ul
                        ref={listRef}
                        id={`${uid}-list`}
                        role="listbox"
                        aria-labelledby={label ? `${uid}-label` : undefined}
                        style={{
                            position: "fixed",
                            top: pos.top,
                            ...(align === "right" ? { right: pos.right } : { left: pos.left }),
                            minWidth: pos.width,
                        }}
                        className="z-50 max-h-64 overflow-auto border border-border-subtle bg-surface-raised shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]"
                    >
                        {opts.map((o, i) => {
                            const isSel = i === selectedIdx;
                            const isHi = i === hi;
                            return (
                                <li
                                    key={`${o.value}-${i}`}
                                    id={`${uid}-opt-${i}`}
                                    role="option"
                                    aria-selected={isSel}
                                    aria-disabled={o.disabled || undefined}
                                    onPointerEnter={() => setHi(i)}
                                    onClick={() => pick(i)}
                                    className={`flex cursor-pointer items-center justify-between gap-4 whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors ${
                                        o.disabled
                                            ? "cursor-not-allowed text-content-muted/40"
                                            : isHi
                                              ? "bg-brand-orange text-white"
                                              : isSel
                                                ? "text-brand-orange"
                                                : "text-content-muted"
                                    }`}
                                >
                                    {o.label}
                                    {isSel && <Check size={13} strokeWidth={3} />}
                                </li>
                            );
                        })}
                    </ul>,
                    document.body,
                )}
        </div>
    );
}
