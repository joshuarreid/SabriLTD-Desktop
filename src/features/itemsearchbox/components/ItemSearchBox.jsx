/**
 * ItemSearchBox.jsx
 *
 * Reusable search bar + item preview grid component.
 * Manages its own search state, pagination, and data fetching via useItemSearchBox.
 * Renders WideSearchBar and ItemCardGrid together as one cohesive unit.
 *
 * @component
 * @param {object} props
 * @param {(item: object) => void} props.onItemClick - Called when an item card is clicked.
 * @param {object} [props.fixedFilters] - Optional Meilisearch filter expression applied to every request.
 * @param {number} [props.columns=5] - Grid columns.
 * @param {number} [props.rows=5] - Grid rows (visual hint; actual count driven by pageSize).
 * @param {number} [props.pageSize=25] - Results per page.
 * @param {string} [props.sortField="name"] - Default sort field.
 * @param {string} [props.sortOrder="asc"] - Default sort order.
 * @param {string} [props.placeholder="Search inventory…"] - Search bar placeholder text.
 * @returns {JSX.Element}
 */

import React from "react";
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
                           onItemClick,
                           fixedFilters,
                           columns = 5,
                           rows = 5,
                           pageSize = 25,
                           sortField = "name",
                           sortOrder = "asc",
                           placeholder = "Search inventory…",
                       }) => {
    logger.info("ItemSearchBox rendered");

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
     * handleCardClick
     * Delegates to parent onItemClick prop.
     *
     * @function handleCardClick
     * @param {object} item
     * @returns {void}
     */
    const handleCardClick = (item) => {
        if (!item) {
            logger.error("handleCardClick called without an item");
            return;
        }

        logger.info("Item clicked", {
            itemId: item.itemId ?? item.id,
            name: item.name,
        });

        if (typeof onItemClick === "function") {
            onItemClick(item);
        }
    };

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
                    onItemClick={handleCardClick}
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

export default ItemSearchBox;