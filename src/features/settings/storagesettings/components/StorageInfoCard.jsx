import React from "react";
import styles from "../styles/storageinfocard.module.css";
import { PiSelectionForegroundBold, PiOfficeChairBold } from "react-icons/pi";
import { FcFilingCabinet } from "react-icons/fc";
import { MdShelves } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa";

/**
 * getStorageIcon
 * Selects the icon for storage based on its name.
 * Applies color accent to each icon for visual clarity.
 *
 * @param {string} name - Storage name
 * @returns {JSX.Element}
 */
function getStorageIcon(name) {
    // Official colors
    const brown = "#C97E38";    // orangish brown
    const grey = "#8187A6";
    const blue = "#4587C7";

    if (!name) {
        return <PiSelectionForegroundBold className={`${styles.storageIcon} ${styles.storageIconGrey}`} />;
    }
    const lower = name.toLowerCase();
    if (lower.includes("shelf") || lower.includes("shelves")) {
        return <MdShelves className={`${styles.storageIcon} ${styles.storageIconGrey}`} />;
    }
    if (lower.includes("cabinet") || lower.includes("cabinets")) {
        // FcFilingCabinet comes with color, but we use a wrapper for optional custom bg (use class only)
        return (
            <span className={styles.cabinetIconWrap}>
                <FcFilingCabinet className={styles.storageIcon} />
            </span>
        );
    }
    if (
        lower.includes("box") ||
        lower.includes("boxes")
    ) {
        return <FaBoxOpen className={`${styles.storageIcon} ${styles.storageIconGrey}`} />;
    }
    if (
        lower.includes("bin") ||
        lower.includes("bins")
    ) {
        return <FaBoxOpen className={`${styles.storageIcon} ${styles.storageIconGrey}`} />;
    }
    if (lower.includes("office")) {
        return <PiOfficeChairBold className={`${styles.storageIcon} ${styles.storageIconGrey}`} />;
    }
    return <PiSelectionForegroundBold className={`${styles.storageIcon} ${styles.storageIconGrey}`} />;
}

/**
 * logger for StorageInfoCard.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[StorageInfoCard]", ...args),
    error: (...args) => console.error("[StorageInfoCard]", ...args),
};

/**
 * StorageInfoCard
 * Renders a single storage location card with dynamic icon selection.
 *
 * @component
 * @param {object} props
 * @param {object} props.storage - Storage object ({ storageId, name, description, buildingId })
 * @param {function} [props.onClick] - Optional callback when the card is clicked (for edit).
 * @returns {JSX.Element}
 */
const StorageInfoCard = ({ storage, onClick }) => {
    logger.info("StorageInfoCard rendered", { storageId: storage?.storageId });
    return (
        <div
            className={styles.storageCard}
            onClick={onClick}
            tabIndex={0}
            role="button"
            style={{ cursor: onClick ? "pointer" : undefined }}
        >
            <div className={styles.storageHeader}>
                <span className={styles.storageIconWrap}>
                    {getStorageIcon(storage.name)}
                </span>
                <span className={styles.storageName}>{storage.name}</span>
            </div>
        </div>
    );
};

export default StorageInfoCard;