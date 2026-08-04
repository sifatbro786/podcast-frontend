// src/hooks/useDebounce.js
// Returns a debounced copy of `value` that only updates after `delay` ms of
// quiet. Used by the admin search bars so we hit the API on the user pausing,
// not on every keystroke.
import { useEffect, useState } from "react";

export function useDebounce(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}
