/**
 * ItemBrowser.jsx
 *
 * Reusable search bar + item preview grid component.
 *
 * Modes:
 * - "browse" (default): single click opens details (delegated via onItemOpenDetails)
 * - "add": single click toggles selection; double click opens details (delegated)
 *
 * Backwards compatible:
 * - If mode is omitted, it behaves like browse mode.
 * - Existing onItemClick usage continues to work in browse mode.
 *
 * @component
 * @param {object} props
 * @param {"browse"|"add"} [props.mode="browse"]
 * @param {(item: object) => void} [props.onItemClick] - In browse mode: single click action (e.g. open item). In add mode: toggles selection.
 * @param {(item: object) => void} [props.onItemOpenDetails] - Optional detail-open handler (used for double click and browse click).
 * @param {(itemId: number|string) => boolean} [props.isItemSelected] - Selection predicate for add mode.
 * @param {object} [props.fixedFilters] - Optional Meilisearch filter expression applied to every request.
 * @param {number} [props.columns=5] - Grid columns.
 * @param {number} [props.rows=5] - Grid rows (visual hint; actual count driven by pageSize).
 * @param {number} [props.pageSize=25] - Results per page.
 * @param {string} [props.sortField="name"] - Default sort field.
 * @param {string} [props.sortOrder="asc"] - Default sort order.
 * @param {string} [props.placeholder="Search inventory…"] - Search bar placeholder text.
 * @returns {JSX.Element}
 */

import React, { useCallback } from "react";
import styles from "../styles/itembrowser.module.css";

import { useItemBrowser } from "../hooks/useItemBrowser";
import WideSearchBar from "../../../components/searchbar/WideSearchBar";
import ItemCardGrid from "./ItemCardGrid";

/**
 * Logger for ItemBrowser.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[ItemBrowser]", ...args),
    error: (...args: unknown[]) => console.error("[ItemBrowser]", ...args),
};

export interface Item {
    itemId?: number | string;
    id?: number | string;
    name?: string;
    [key: string]: unknown;
}

export interface ItemBrowserProps {
    mode?: "browse" | "add";
    onItemClick?: (item: Item) => void;
    onItemOpenDetails?: (item: Item) => void;
    isItemSelected?: (itemId: number | string) => boolean;
    fixedFilters?: object;
    columns?: number;
    rows?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    placeholder?: string;
}

/**
 * ItemBrowser
 *
 * @component
 * @param {ItemBrowserProps} props
 * @returns {JSX.Element}
 */
const ItemBrowser: React.FC<ItemBrowserProps> = ({
    mode = "browse",
    onItemClick,
    onItemOpenDetails,
    isItemSelected,
    fixedFilters,
    columns = 5,
    rows = 5,
    pageSize = 25,
    sortField = "name",
    sortOrder = "asc",
    placeholder = "Search inventory…",
}) => {
    logger.info("ItemBrowser rendered", { mode });

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
    } = useItemBrowser({
        fixedFilters,
        pageSize,
        sortField,
        sortOrder,
        placeholder,
    });

    const handleSingleClick = useCallback(
        (item: Item) => {
            if (!item) {
                logger.error("handleSingleClick called without an item");
                return;
            }

            const itemId = item?.itemId ?? item?.id;

            logger.info("Item single click", {
                mode,
                itemId,
                name: item?.name,
            });

            if (mode === "add") {
                if (typeof onItemClick === "function") {
                    onItemClick(item);
                }
                return;
            }

            if (typeof onItemOpenDetails === "function") {
                onItemOpenDetails(item);
                return;
            }

            if (typeof onItemClick === "function") {
                onItemClick(item);
            }
        },
        [mode, onItemClick, onItemOpenDetails],
    );

    const handleDoubleClick = useCallback(
        (item: Item) => {
            if (!item) {
                logger.error("handleDoubleClick called without an item");
                return;
            }

            const itemId = item?.itemId ?? item?.id;

            logger.info("Item double click", { itemId, mode });

            if (typeof onItemOpenDetails === "function") {
                onItemOpenDetails(item);
                return;
            }

            if (typeof onItemClick === "function") {
                onItemClick(item);
            }
        },
        [mode, onItemClick, onItemOpenDetails],
    );

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
                    onItemClick={handleSingleClick}
                    onItemDoubleClick={handleDoubleClick}
                    isItemSelected={mode === "add" ? isItemSelected : undefined}
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
                />
            </div>
        </div>
    );
};

export default ItemBrowser;

