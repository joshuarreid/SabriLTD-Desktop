/**
 * JobItemGridBox.jsx
 *
 * UI-only component extracted from JobDetailScreen for scale.
 * Renders the ItemCardGrid for items associated with a job.
 *
 * IMPORTANT:
 * - No business logic or fetching here.
 * - Receives already-prepared state from useJobDetailScreen.
 *
 * @component
 * @param {object} props
 * @param {Array<object>} props.items
 * @param {boolean} props.isPending
 * @param {boolean} props.isError
 * @param {any} props.error
 * @param {number} props.page
 * @param {(page: number) => void} props.setPage
 * @param {number} props.pageSize
 * @param {(pageSize: number) => void} props.setPageSize
 * @param {number} props.totalPages
 * @param {number} props.totalItems
 * @param {boolean} props.hasPrevious
 * @param {boolean} props.hasNext
 * @param {number} props.itemStart
 * @param {number} props.itemEnd
 * @param {() => void} props.handleNext
 * @param {() => void} props.handlePrevious
 * @param {() => void} props.refetch
 * @param {(item: object) => void} props.onItemClick
 * @returns {JSX.Element}
 */

import React from "react";
import ItemCardGrid from "../../itemsearchbox/components/ItemCardGrid";


/**
 * Logger for JobItemGridBox.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[JobItemGridBox]", ...args),
    error: (...args) => console.error("[JobItemGridBox]", ...args),
};

const JobItemGridBox = ({
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
                            hasPrevious,
                            hasNext,
                            itemStart,
                            itemEnd,
                            handleNext,
                            handlePrevious,
                            refetch,
                            onItemClick,
                        }) => {
    logger.info("JobItemGridBox rendered", {
        itemsCount: Array.isArray(items) ? items.length : 0,
        page,
        pageSize,
        totalItems,
    });

    return (
        <ItemCardGrid
            items={items}
            columns={5}
            rows={5}
            onItemClick={onItemClick}
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
            setPageSize={setPageSize}
            handleNext={handleNext}
            handlePrevious={handlePrevious}
            refetch={refetch}
        />
    );
};

export default JobItemGridBox;