import React from "react";
import ItemCardGrid from "../components/item-grid/components/ItemCardGrid";
import WideSearchBar from "../components/searchbar/WideSearchBar";
import { useViewItemModal } from "../components/viewitemmodal/hooks/useViewItemModal";
import ViewItemModal from "../components/viewitemmodal/components/ViewItemModal";
import useInventoryDashboardScreen from "../components/item-grid/hooks/useInventoryDashboardScreen";


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
 * Home page showing a 5x5 grid of inventory items (no default filters) and
 * a read-only modal for viewing item details on card click.
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
        setPageSize, // currently unused but exposed for future controls
        totalPages,
        totalItems,
        itemStart,
        itemEnd,
        hasPrevious,
        hasNext,
        handleNext,
        handlePrevious,
        refetch,
        search,
        handleSearchChange,
    } = useInventoryDashboardScreen();

    const {
        isOpen,
        previewItem,
        selectedItemId,
        openWithItem,
        close,
    } = useViewItemModal();

    /**
     * handleItemClick
     * Called when an ItemInfoCard is clicked.
     * Receives the full normalized item object from ItemCardGrid.
     *
     * @function handleItemClick
     * @param {object} item
     * @returns {void}
     */
    const handleItemClick = (item) => {
        if (!item) {
            logger.error(
                "handleItemClick called without an item in InventoryDashboardScreen",
            );
            return;
        }

        logger.info("Item clicked from grid (object payload)", {
            itemId: item.itemId,
            name: item.name,
        });

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
                totalItems={totalItems}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                itemStart={itemStart}
                itemEnd={itemEnd}
                pageSize={pageSize}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
                refetch={refetch}
            />

            <ViewItemModal
                previewItem={previewItem}
                itemId={selectedItemId}
                open={isOpen}
                onClose={close}
            />
        </div>
    );
};

export default InventoryDashboardScreen;