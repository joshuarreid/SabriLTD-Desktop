/**
 * InventoryDashboardScreen.jsx
 *
 * Home page showing a 5×5 grid of inventory items with integrated search.
 * Uses ItemSearchBox (reusable search bar + item preview grid) and
 * ViewItemModal for read-only detail viewing on card click.
 *
 * All data fetching and business logic delegated to hooks per Bulletproof React conventions.
 *
 * @component
 * @returns {JSX.Element}
 */

import React from "react";
import ItemSearchBox from "../features/itemsearchbox/components/ItemSearchBox";
import { useViewItemModal } from "../components/viewitemmodal/hooks/useViewItemModal";
import ViewItemModal from "../components/viewitemmodal/components/ViewItemModal";

/**
 * Logger for InventoryDashboardScreen.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[InventoryDashboardScreen]", ...args),
    error: (...args) => console.error("[InventoryDashboardScreen]", ...args),
};

const InventoryDashboardScreen = () => {
    logger.info("InventoryDashboardScreen rendered");

    const {
        isOpen,
        isDetailsPending,
        isDetailsError,
        detailsError,
        resolvedId,
        resolvedName,
        resolvedDescription,
        resolvedCondition,
        resolvedStorageDesc,
        resolvedUpdatedBy,
        resolvedDateAdded,
        resolvedDateUpdated,
        resolvedTags,
        resolvedJobs,
        resolvedComments,
        resolvedPhotos,
        resolvedBuilding,
        openWithItem,
        close,
    } = useViewItemModal();

    /**
     * handleItemClick
     * Called when an ItemInfoCard is clicked inside ItemSearchBox.
     * Opens the view-item modal with the selected item preview data.
     *
     * @function handleItemClick
     * @param {object} item - Normalized item preview object from the search grid.
     * @returns {void}
     */
    const handleItemClick = (item) => {
        if (!item) {
            logger.error(
                "handleItemClick called without an item in InventoryDashboardScreen",
            );
            return;
        }

        logger.info("Item clicked from grid", {
            itemId: item.itemId ?? item.id,
            name: item.name,
        });

        openWithItem(item);
    };

    return (
        <div>
            <ItemSearchBox
                onItemClick={handleItemClick}
                columns={5}
                rows={5}
                pageSize={25}
                sortField="name"
                sortOrder="asc"
                placeholder="Search inventory…"
            />

            <ViewItemModal
                open={isOpen}
                onClose={close}
                isDetailsPending={isDetailsPending}
                isDetailsError={isDetailsError}
                detailsError={detailsError}
                resolvedId={resolvedId}
                resolvedName={resolvedName}
                resolvedDescription={resolvedDescription}
                resolvedCondition={resolvedCondition}
                resolvedStorageDesc={resolvedStorageDesc}
                resolvedUpdatedBy={resolvedUpdatedBy}
                resolvedDateAdded={resolvedDateAdded}
                resolvedDateUpdated={resolvedDateUpdated}
                resolvedTags={resolvedTags}
                resolvedJobs={resolvedJobs}
                resolvedComments={resolvedComments}
                resolvedPhotos={resolvedPhotos}
                resolvedBuilding={resolvedBuilding}
            />
        </div>
    );
};

export default InventoryDashboardScreen;