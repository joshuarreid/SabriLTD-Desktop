import React from "react";
import ItemCardGrid from "../features/item-grid/components/ItemCardGrid";
import useItemCardGrid from "../features/item-grid/hooks/useItemCardGrid";



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

    // Fetch paginated items (no filters), 5 columns × 5 rows = 25 per page
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
        fixedFilters: {}, // No default filters
        initialPage: 1,
        pageSize: 25,
        sortField: "name",
        sortOrder: "asc",
    });

    return (
        <div>
            <ItemCardGrid
                items={items}
                columns={5}
                rows={5}
                title="Inventory"
                onItemClick={(itemId) => logger.info("Item clicked", { itemId })}
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
        </div>
    );
};

export default InventoryDashboardScreen;