/**
 * ItemSearchBox.jsx
 *
 * Reusable search bar + item preview grid component.
 *
 * Supports two modes:
 * - "browse" (default): single-click calls onItemClick (opens detail modal, navigates, etc.).
 * - "add": single-click toggles item selection; double-click calls onItemClick for detail view.
 *
 * @component
 * @param {object} props
 * @param {"browse"|"add"} [props.mode="browse"] - Interaction mode.
 * @param {(item: object) => void} props.onItemClick - Called on click (browse) or double-click (add).
 * @param {(itemId: number|string) => boolean} [props.isItemSelected] - Required in add mode. Returns true if selected.
 * @param {object} [props.fixedFilters] - Optional Meilisearch filter expression applied to every request.
 * @param {number} [props.columns=5] - Grid columns.
 * @param {number} [props.rows=5] - Grid rows (visual hint; actual count driven by pageSize).
 * @param {number} [props.pageSize=25] - Results per page.
 * @param {string} [props.sortField="name"] - Default sort field.
 * @param {string} [props.sortOrder="asc"] - Default sort order.
 * @param {string} [props.placeholder="Search inventory…"] - Search bar placeholder text.
 * @returns {JSX.Element}
 */

import React, { useCallback, useRef } from "react";
import styles from "../styles/itemsearchbox.module.css";

import { useItemSearchBox } from "../hooks/useItemSearchBox";
import WideSearchBar from "../../../components/searchbar/WideSearchBar";
import ItemCardGrid from "./ItemCardGrid";

/**
 * Logger for ItemSearchBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ItemSearchBox]", ...args),
    error: (...args) => console.error("[ItemSearchBox]", ...args),
};

const ItemSearchBox = ({
                           mode = "browse",
                           onItemClick,
                           isItemSelected,
                           fixedFilters,
                           columns = 5,
                           rows = 5,
                           pageSize = 25,
                           sortField = "name",
                           sortOrder = "asc",
                           placeholder = "Search inventory…",
                       }) => {
    logger.info("ItemSearchBox rendered", { mode });

    const {
        searchInput,
        handleSearchChange,
        handleSearchKeyDown,
        items,
        isPending,
        isError,
        error,
        page,
        setPage,
        pageSize: currentPageSize,
        totalPages,
        totalItems,
        itemStart,
        itemEnd,
        hasPrevious,
        hasNext,
        handleNext,
        handlePrevious,
        refetch,
    } = useItemSearchBox({
        fixedFilters,
        pageSize,
        sortField,
        sortOrder,
        placeholder,
    });

    /**
     * clickTimerRef
     * Used to distinguish single-click from double-click in add mode.
     *
     * @type {React.MutableRefObject<any>}
     */
    const clickTimerRef = useRef(null);

    /**
     * DOUBLE_CLICK_DELAY_MS
     * Max delay between clicks to register as a double-click.
     *
     * @constant
     * @type {number}
     */
    const DOUBLE_CLICK_DELAY_MS = 250;

    /**
     * handleCardInteraction
     * In browse mode: delegates directly to onItemClick on single-click.
     * In add mode: single-click toggles selection; double-click opens detail.
     *
     * @function handleCardInteraction
     * @param {object} item
     * @returns {void}
     */
    const handleCardInteraction = useCallback(
        (item) => {
            if (!item) {
                logger.error("handleCardInteraction called without an item");
                return;
            }

            if (mode === "browse") {
                logger.info("Browse mode: item clicked", {
                    itemId: item.itemId ?? item.id,
                });
                if (typeof onItemClick === "function") {
                    onItemClick(item);
                }
                return;
            }

            // Add mode: distinguish single from double click
            if (clickTimerRef.current) {
                // Second click within threshold → double-click
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;

                logger.info("Add mode: double-click (open detail)", {
                    itemId: item.itemId ?? item.id,
                });

                if (typeof onItemClick === "function") {
                    onItemClick(item);
                }
                return;
            }

            // First click — wait to see if double-click follows
            clickTimerRef.current = setTimeout(() => {
                clickTimerRef.current = null;

                logger.info("Add mode: single-click (toggle selection)", {
                    itemId: item.itemId ?? item.id,
                });

                // In add mode, single-click calls onItemClick which is wired
                // to toggleItem from useAddItemsToJobModal
                if (typeof onItemClick === "function") {
                    onItemClick(item);
                }
            }, DOUBLE_CLICK_DELAY_MS);
        },
        [mode, onItemClick],
    );

    /**
     * handleDoubleClick
     * Explicit double-click handler for add mode.
     * Opens item detail via onItemDoubleClick if provided, otherwise no-op.
     * NOTE: The double-click is already handled in handleCardInteraction
     * via the click timer pattern above.
     *
     * @function handleDoubleClick
     */

    return (
        <div className={styles.container}>
            <div className={styles.searchRow}>
                <WideSearchBar
                    value={searchInput}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={placeholder}
                    ariaLabel={placeholder}
                    fluid
                />
            </div>

            <div className={styles.gridSection}>
                <ItemCardGrid
                    items={items}
                    columns={columns}
                    rows={rows}
                    onItemClick={handleCardInteraction}
                    isPending={isPending}
                    isError={isError}
                    error={error}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    itemStart={itemStart}
                    itemEnd={itemEnd}
                    pageSize={currentPageSize}
                    handleNext={handleNext}
                    handlePrevious={handlePrevious}
                    refetch={refetch}
                    mode={mode}
                    isItemSelected={isItemSelected}
                />
            </div>
        </div>
    );
};

export default ItemSearchBox;