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

const logger: { info: (...args: any[]) => void; error: (...args: any[]) => void } = {
    info: (...args: any[]) => console.log("[useNaturalSort]", ...args),
    error: (...args: any[]) => console.error("[useNaturalSort]", ...args),
};

function naturalCompare(a: string = "", b: string = ""): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

type KeyFunction<T> = (item: T) => string;
type Order = "asc" | "desc";
interface UseNaturalSortOptions<T> {
    key?: keyof T | KeyFunction<T>;
    order?: Order;
}

export function useNaturalSort<T>(items: T[], options: UseNaturalSortOptions<T> = {}): T[] {
    const { key, order = "asc" } = options;

    const sorted = useMemo(() => {
        logger.info("useNaturalSort sorting", {
            length: Array.isArray(items) ? items.length : 0,
            key,
            order,
        });
        if (!Array.isArray(items) || items.length === 0) return [];
        return [...items].sort((a, b) => {
            let aVal: string = "";
            let bVal: string = "";
            if (typeof key === "function") {
                aVal = key(a);
                bVal = key(b);
            } else if (typeof key === "string") {
                aVal = (a as any)[key] ?? "";
                bVal = (b as any)[key] ?? "";
            } else {
                aVal = String(a);
                bVal = String(b);
            }
            const cmp = naturalCompare(aVal, bVal);
            return order === "desc" ? -cmp : cmp;
        });
    }, [items, key, order]);
    return sorted;
}
