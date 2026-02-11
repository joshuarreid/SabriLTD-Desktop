import React from "react";
import ItemCardGrid from "../components/item-grid/components/ItemCardGrid";
import useItemCardGrid from "../components/item-grid/hooks/useItemCardGrid";
import WideSearchBar from "../components/searchbar/WideSearchBar";
import {useViewItemModal} from "../components/viewitemmodal/hooks/useViewItemModal";
import ViewItemModal from "../components/viewitemmodal/components/ViewItemModal";


/**
 * logger for InventoryDashboardScreen.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[InventoryDashboardScreen]", ...args),
    error: (...args) => console.error("[InventoryDashboardScreen]", ...args),
};

/**
 * InventoryDashboardScreen
 * - Home page showing a 5x5 grid of inventory items (no default filters).
 *
 * @component
 * @returns {JSX.Element}
 */
const InventoryDashboardScreen = () => {
    logger.info("InventoryDashboardScreen rendered");

    const {
        items,
        isPending,
        isError,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems,
        itemStart,
        itemEnd,
        hasPrevious,
        hasNext,
        handleNext,
        handlePrevious,
        refetch,
    } = useItemCardGrid({
        fixedFilters: {},
        initialPage: 1,
        pageSize: 25,
        sortField: "name",
        sortOrder: "asc",
    });

    const [search, setSearch] = React.useState("");
    const handleSearchChange = (e) => setSearch(e.target.value);

    const { isOpen, selectedItem, openWithItem, close } = useViewItemModal();

    /**
     * Handles click on an item card in the grid.
     * Attempts to find the full item object from the items array,
     * then opens the ViewItemModal with that item.
     *
     * @function handleItemClick
     * @param {number|string} itemId
     */
    const handleItemClick = (itemId) => {
        logger.info("Item clicked from grid", { itemId });
        const item = items?.find(
            (it) => it.itemId === itemId || it.id === itemId
        );

        if (!item) {
            logger.error("Item not found in current page for modal", { itemId });
            return;
        }

        openWithItem(item);
    };

    return (
        <div>
            <div style={{ marginBottom: 18, marginTop: 10 }}>
                <WideSearchBar
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search inventory…"
                    fluid
                />
            </div>
            <ItemCardGrid
                items={items}
                columns={5}
                rows={5}
                onItemClick={handleItemClick}
                isPending={isPending}
                isError={isError}
                error={error}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                itemStart={itemStart}
                itemEnd={itemEnd}
                pageSize={pageSize}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
                refetch={refetch}
            />

            <ViewItemModal item={selectedItem} open={isOpen} onClose={close} />
        </div>
    );
};

export default InventoryDashboardScreen;