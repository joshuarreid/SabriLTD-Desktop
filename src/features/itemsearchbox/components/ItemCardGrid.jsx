import React, { useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
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
    info: (...args) => console.log("[ItemCardGrid]", ...args),
    error: (...args) => console.error("[ItemCardGrid]", ...args),
};

/**
 * ItemCardGrid
 * Renders a responsive paginated grid of ItemInfoCard components.
 *
 * NOTE:
 * - Supports an optional "selectable" mode to visually mark selected cards.
 * - Supports single click and double click events without breaking existing usage.
 *
 * @component
 * @param {Object} props
 * @param {Array} props.items - Array of item objects to render (each with itemId).
 * @param {number} props.columns - Grid columns.
 * @param {number} props.rows - Grid rows shown per page.
 * @param {string} [props.title="Items"] - Title above the grid.
 * @param {(item:object)=>void} [props.onItemClick] - Optional click handler per card.
 * @param {(item:object)=>void} [props.onItemDoubleClick] - Optional double click handler per card.
 * @param {(itemId:number|string)=>boolean} [props.isItemSelected] - Returns true if an item is selected.
 * @param {boolean} [props.isPending] - Query loading state.
 * @param {boolean} [props.isError] - Query error state.
 * @param {any} [props.error] - Error object if any.
 * @param {number} [props.page] - Current page.
 * @param {Function} [props.setPage] - Setter for current page.
 * @param {number} [props.pageSize] - Page size.
 * @param {number} [props.totalPages] - Server totalPages.
 * @param {number} [props.totalItems] - Server total records.
 * @param {number} [props.itemStart] - Pager calculated from query meta.
 * @param {number} [props.itemEnd] - Pager calculated from query meta.
 * @param {boolean} [props.hasPrevious] - Has previous page flag.
 * @param {boolean} [props.hasNext] - Has next page flag.
 * @param {Function} [props.handleNext] - Next page handler.
 * @param {Function} [props.handlePrevious] - Previous page handler.
 * @param {Function} [props.refetch] - Query refetch handler.
 * @returns {JSX.Element}
 */
const ItemCardGrid = ({
                          items = [],
                          columns = 6,
                          rows = 3,
                          title = "Items",
                          onItemClick,
                          onItemDoubleClick,
                          isItemSelected,
                          isPending,
                          isError,
                          error,
                          page,
                          setPage,
                          totalPages,
                          totalItems,
                          itemStart,
                          itemEnd,
                          hasPrevious,
                          hasNext,
                          handleNext,
                          handlePrevious,
                          pageSize,
                          refetch,
                      }) => {
    const gridTemplateColumns = `repeat(6, minmax(var(--item-card-min-width), 1fr))`;

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
    const clickTimeoutRef = useRef(null);

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
     * @param {object} item
     * @returns {void}
     */
    const handleCardClick = useCallback(
        (item) => {
            if (!onItemClick) return;

            clearPendingClick();

            clickTimeoutRef.current = setTimeout(() => {
                logger.info("Item card clicked (single)", {
                    itemId: item?.itemId ?? item?.id,
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
     * @param {object} item
     * @returns {void}
     */
    const handleCardDoubleClick = useCallback(
        (item) => {
            if (!onItemDoubleClick) return;

            clearPendingClick();

            logger.info("Item card double-clicked", {
                itemId: item?.itemId ?? item?.id,
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
                    Error: {error?.message || "Failed to load items."}
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
                        {items.map((item) => {
                            const id = item?.itemId ?? item?.id;
                            const selected =
                                typeof isItemSelected === "function" && id != null
                                    ? Boolean(isItemSelected(id))
                                    : false;

                            return (
                                <motion.div
                                    key={item.itemId}
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
                                            itemId: item.itemId,
                                            name: item.name,
                                            conditionName: item.condition,
                                            photoUrl: item.photoUrl,
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
                            "Showing 0 items"
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

ItemCardGrid.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            itemId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
                .isRequired,
            name: PropTypes.string.isRequired,
            conditionName: PropTypes.string,
            photoUrl: PropTypes.string,
        }),
    ),
    columns: PropTypes.number,
    rows: PropTypes.number,
    title: PropTypes.string,
    onItemClick: PropTypes.func,
    onItemDoubleClick: PropTypes.func,
    isItemSelected: PropTypes.func,
    isPending: PropTypes.bool,
    isError: PropTypes.bool,
    error: PropTypes.any,
    page: PropTypes.number,
    setPage: PropTypes.func,
    totalPages: PropTypes.number,
    totalItems: PropTypes.number,
    itemStart: PropTypes.number,
    itemEnd: PropTypes.number,
    hasPrevious: PropTypes.bool,
    hasNext: PropTypes.bool,
    handleNext: PropTypes.func,
    handlePrevious: PropTypes.func,
    pageSize: PropTypes.number,
    refetch: PropTypes.func,
};

ItemCardGrid.defaultProps = {
    items: [],
    columns: 6,
    rows: 3,
    title: "Items",
    onItemClick: undefined,
    onItemDoubleClick: undefined,
    isItemSelected: undefined,
    isPending: false,
    isError: false,
    error: null,
    page: 1,
    setPage: undefined,
    totalPages: 1,
    totalItems: 0,
    itemStart: 0,
    itemEnd: 0,
    hasPrevious: false,
    hasNext: false,
    handleNext: undefined,
    handlePrevious: undefined,
    pageSize: 0,
    refetch: undefined,
};

export default ItemCardGrid;