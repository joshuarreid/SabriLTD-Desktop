/**
 * useNaturalSort
 * Bulletproof React hook for naturally sorting arrays by a specified key, using localeCompare numeric order.
 *
 * @module useNaturalSort
 * @param {Array} item - The array of item to sort.
 * @param {Object} [options]
 * @param {string|function} [options.key] - Property name or accessor function for sort value.
 * @param {"asc"|"desc"} [options.order=asc] - Sort direction.
 * @returns {Array} Stable, naturally sorted array.
 *
 * @example
 * const sorted = useNaturalSort(item, { key: "name", order: "asc" });
 * const sorted = useNaturalSort(users, { key: u => u.email, order: "desc" });
 */
import { useMemo } from "react";

const logger = {
    info: (...args) => console.log("[useNaturalSort]", ...args),
    error: (...args) => console.error("[useNaturalSort]", ...args),
};

/**
 * Natural string comparison (locale-aware, numeric, case-insensitive).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function naturalCompare(a = "", b = "") {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Generic hook for natural alphabetical sorting.
 * Follows Bulletproof React recommendations for purity, memoization, logging, and docs.
 */
export function useNaturalSort(items, options = {}) {
    const { key, order = "asc" } = options;

    const sorted = useMemo(() => {
        logger.info("useNaturalSort sorting", {
            length: Array.isArray(items) ? items.length : 0,
            key,
            order,
        });
        if (!Array.isArray(items) || items.length === 0) return [];
        return [...items].sort((a, b) => {
            let aVal, bVal;
            if (typeof key === "function") {
                aVal = key(a);
                bVal = key(b);
            } else if (typeof key === "string") {
                aVal = a?.[key];
                bVal = b?.[key];
            } else {
                aVal = a;
                bVal = b;
            }
            aVal = aVal == null ? "" : String(aVal).toLowerCase();
            bVal = bVal == null ? "" : String(bVal).toLowerCase();
            const cmp = naturalCompare(aVal, bVal);
            return order === "desc" ? -cmp : cmp;
        });
    }, [items, key, order]);

    return sorted;
}
