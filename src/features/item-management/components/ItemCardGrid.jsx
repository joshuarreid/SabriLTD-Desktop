/**
 * ItemCardGrid.jsx
 *
 * Responsive, paginated grid for ItemInfoCard components.
 * - Configurable rows and columns per page.
 * - Uses useItemCardGrid for pagination + layout.
 * - Purely presentational: no data fetching or business logic.
 */

import React from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/itemcardgrid.module.css";
import ItemInfoCard from "./ItemInfoCard";
import { useItemCardGrid } from "../hooks/useItemCardGrid";

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
 * - Renders a grid of ItemInfoCard components with configurable
 *   columns and rows per page and JobScreen-style pagination controls.
 *
 * @component
 * @param {Object} props
 * @param {Array<{
 *   itemId: number,
 *   name: string,
 *   conditionName?: string|null,
 *   photoUrl?: string|null
 * }>} props.items - Full collection of items to render.
 * @param {number} [props.columns=5] - Number of columns in the grid.
 * @param {number} [props.rows=3] - Number of rows per page (controls page size).
 * @param {string} [props.title="Items"] - Optional title shown above the grid.
 * @param {(itemId:number)=>void} [props.onItemClick] - Optional click handler for cards.
 * @returns {JSX.Element}
 */
const ItemCardGrid = ({
                          items,
                          columns = 5,
                          rows = 3,
                          title = "Items",
                          onItemClick,
                      }) => {
    const {
        pageItems,
        totalItems,
        page,
        totalPages,
        hasPrevious,
        hasNext,
        itemStart,
        itemEnd,
        handleNext,
        handlePrevious,
        gridTemplateColumns,
    } = useItemCardGrid({ items, columns, rows });

    return (
        <section className={styles.itemGridSection} aria-label={title}>
            <header className={styles.headerRow}>
                <h2 className={styles.title}>{title}</h2>
            </header>

            {totalItems === 0 ? (
                <div className={styles.emptyState}>No items found.</div>
            ) : (
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
                            {pageItems.map((item) => (
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
                                >
                                    <ItemInfoCard
                                        item={{
                                            itemId: item.itemId,
                                            name: item.name,
                                            conditionName: item.conditionName,
                                            photoUrl: item.photoUrl,
                                        }}
                                        onClick={() => {
                                            logger.info("Item card clicked", {
                                                itemId: item.itemId,
                                            });
                                            if (onItemClick) {
                                                onItemClick(item.itemId);
                                            }
                                        }}
                                    />
                                </motion.div>
                            ))}
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
                                onClick={handlePrevious}
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
                                onClick={handleNext}
                                disabled={!hasNext}
                            >
                                Next
                            </button>
                        </div>
                    </footer>
                </>
            )}
        </section>
    );
};

ItemCardGrid.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            itemId: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            conditionName: PropTypes.string,
            photoUrl: PropTypes.string,
        }),
    ).isRequired,
    columns: PropTypes.number,
    rows: PropTypes.number,
    title: PropTypes.string,
    onItemClick: PropTypes.func,
};

ItemCardGrid.defaultProps = {
    columns: 5,
    rows: 3,
    title: "Items",
    onItemClick: undefined,
};

export default ItemCardGrid;