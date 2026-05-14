import React, { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/itemcardgrid.module.css";
import ItemInfoCard from "./ItemInfoCard";

/**
 * logger for ItemCardGrid.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[ItemCardGrid]", ...args),
    error: (...args: unknown[]) => console.error("[ItemCardGrid]", ...args),
};

export interface ItemCardGridItem {
    itemId?: number | string;
    id?: number | string;
    name?: string;
    condition?: string;
    conditionName?: string;
    photoUrl?: string;
    [key: string]: unknown;
}

export interface ItemCardGridProps {
    items?: ItemCardGridItem[];
    columns?: number;
    rows?: number;
    title?: string;
    onItemClick?: (item: ItemCardGridItem) => void;
    onItemDoubleClick?: (item: ItemCardGridItem) => void;
    isItemSelected?: (itemId: number | string) => boolean;
    isPending?: boolean;
    isError?: boolean;
    error?: any;
    page?: number;
    setPage?: (page: number) => void;
    totalPages?: number;
    totalItems?: number;
    itemStart?: number;
    itemEnd?: number;
    hasPrevious?: boolean;
    hasNext?: boolean;
    handleNext?: () => void;
    handlePrevious?: () => void;
    pageSize?: number;
    refetch?: () => void;
}

/**
 * getCanonicalItemId
 * Returns a stable item identifier across API shapes.
 *
 * @function getCanonicalItemId
 * @param {ItemCardGridItem} item
 * @returns {number|string|null} Canonical id for the item or null if unavailable.
 */
const getCanonicalItemId = (item: ItemCardGridItem): number | string | null => {
    const id = item?.id ?? item?.itemId;
    return id != null ? id : null;
};

/**
 * getCanonicalItemKey
 * Builds a stable React key for an item.
 *
 * @function getCanonicalItemKey
 * @param {ItemCardGridItem} item
 * @param {number} index
 * @returns {string}
 */
const getCanonicalItemKey = (item: ItemCardGridItem, index: number): string => {
    const id = getCanonicalItemId(item);
    return id != null ? `item-${String(id)}` : `item-index-${index}`;
};

/**
 * ItemCardGrid
 * Renders a responsive paginated grid of ItemInfoCard components.
 *
 * @component
 * @param {ItemCardGridProps} props
 * @returns {JSX.Element}
 */
const ItemCardGrid: React.FC<ItemCardGridProps> = ({
    items = [],
    columns = 6,
    rows = 3,
    title = "Items",
    onItemClick,
    onItemDoubleClick,
    isItemSelected,
    isPending = false,
    isError = false,
    error = null,
    page = 1,
    setPage,
    totalPages = 1,
    totalItems = 0,
    itemStart = 0,
    itemEnd = 0,
    hasPrevious = false,
    hasNext = false,
    handleNext,
    handlePrevious,
    pageSize = 0,
    refetch,
}) => {
    const gridTemplateColumns = `repeat(${columns}, minmax(var(--item-card-min-width), 1fr))`;

    logger.info("ItemCardGrid render", {
        itemsCount: items.length,
        firstItemDebug: items[0],
        columns,
        rows,
        pageSize,
        page,
        totalPages,
        hasDoubleClick: Boolean(onItemDoubleClick),
        hasSelection: typeof isItemSelected === "function",
    });

    /**
     * clickTimeoutRef
     * Used to avoid triggering single-click when a double-click happens.
     *
     * @type {React.MutableRefObject<any>}
     */
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * clearPendingClick
     * Clears any scheduled single-click handler.
     *
     * @function clearPendingClick
     * @returns {void}
     */
    const clearPendingClick = useCallback(() => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
    }, []);

    /**
     * handleCardClick
     * Schedules a single-click callback and cancels if double-click occurs.
     *
     * @function handleCardClick
     * @param {ItemCardGridItem} item
     * @returns {void}
     */
    const handleCardClick = useCallback(
        (item: ItemCardGridItem) => {
            if (!onItemClick) return;

            clearPendingClick();

            clickTimeoutRef.current = setTimeout(() => {
                logger.info("Item card clicked (single)", {
                    itemId: getCanonicalItemId(item),
                });
                onItemClick(item);
                clickTimeoutRef.current = null;
            }, 180);
        },
        [onItemClick, clearPendingClick],
    );

    /**
     * handleCardDoubleClick
     * Immediately triggers the double-click callback (and cancels any pending single-click).
     *
     * @function handleCardDoubleClick
     * @param {ItemCardGridItem} item
     * @returns {void}
     */
    const handleCardDoubleClick = useCallback(
        (item: ItemCardGridItem) => {
            if (!onItemDoubleClick) return;

            clearPendingClick();

            logger.info("Item card double-clicked", {
                itemId: getCanonicalItemId(item),
            });

            onItemDoubleClick(item);
        },
        [onItemDoubleClick, clearPendingClick],
    );

    /**
     * renderGridContent
     *
     * @function
     * @returns {JSX.Element}
     */
    const renderGridContent = () => {
        if (isError) {
            return (
                <div className={styles.error}>
                    Error: {error?.message || "Failed to load item."}
                </div>
            );
        }

        if (isPending) {
            return <div className={styles.loading}>Loading items…</div>;
        }

        if (!items || items.length === 0) {
            return <div className={styles.emptyState}>No items found.</div>;
        }

        return (
            <>
                <motion.div
                    className={styles.itemGrid}
                    style={{ gridTemplateColumns }}
                    layout
                    transition={{
                        layout: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                    }}
                >
                    <AnimatePresence>
                        {(items as ItemCardGridItem[]).map((item: ItemCardGridItem, index: number) => {
                            const id = getCanonicalItemId(item);
                            const key = getCanonicalItemKey(item, index);

                            const selected =
                                typeof isItemSelected === "function" && id != null
                                    ? Boolean(isItemSelected(id))
                                    : false;

                            return (
                                <motion.div
                                    key={key}
                                    layout
                                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                                    transition={{
                                        duration: 0.22,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className={`${styles.cardWrapper} ${
                                        selected ? styles.cardWrapperSelected : ""
                                    }`}
                                    onDoubleClick={() => handleCardDoubleClick(item)}
                                >
                                    <ItemInfoCard
                                        item={{
                                            itemId: id,
                                            name: item?.name,
                                            conditionName: item?.condition,
                                            photoUrl: item?.photoUrl,
                                        }}
                                        onClick={() => handleCardClick(item)}
                                    />

                                    {selected ? (
                                        <div className={styles.selectedBadge}>✓</div>
                                    ) : null}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>

                <footer
                    className={styles.paginationFooter}
                    aria-label="Item pagination"
                >
                    <div className={styles.paginationSummary}>
                        {totalItems === 0 ? (
                            "Showing 0 item"
                        ) : (
                            <>
                                Showing {itemStart}–{itemEnd} of {totalItems} items
                            </>
                        )}
                    </div>
                    <div className={styles.paginationControls}>
                        <button
                            type="button"
                            className={styles.paginationButton}
                            onClick={() => handlePrevious?.()}
                            disabled={!hasPrevious}
                        >
                            Previous
                        </button>
                        <span className={styles.paginationIndicator}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            className={styles.paginationButton}
                            onClick={() => handleNext?.()}
                            disabled={!hasNext}
                        >
                            Next
                        </button>
                    </div>
                </footer>
            </>
        );
    };

    return (
        <section className={styles.itemGridSection} aria-label={title}>
            {renderGridContent()}
        </section>
    );
};

export default ItemCardGrid;

