// src/components/admin/SearchBar.jsx
// Underline-only search field (brand convention: no boxed inputs). Controlled;
// the parent debounces via useDebounce before hitting the API.
import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search…", className = "" }) {
    return (
        <div
            className={`group flex items-center gap-2 border-b-2 border-border-subtle py-2 transition-colors focus-within:border-brand-orange ${className}`}
        >
            <Search
                size={16}
                className="shrink-0 text-content-muted transition-colors group-focus-within:text-brand-orange"
            />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-sm font-bold text-content outline-none placeholder:font-medium placeholder:text-content-muted/50 [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="shrink-0 text-content-muted transition-colors hover:text-brand-orange"
                >
                    <X size={15} />
                </button>
            )}
        </div>
    );
}
