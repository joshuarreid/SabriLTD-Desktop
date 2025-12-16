import React from "react";
import styles from "../styles/storageinfocard.module.css";
import { PiSelectionForegroundBold, PiOfficeChairBold } from "react-icons/pi";
import { MdShelves } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa";
import { BiSolidCabinet } from "react-icons/bi";

/**
 * logger for StorageInfoCard.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[StorageInfoCard]", ...args),
    error: (...args) => console.error("[StorageInfoCard]", ...args),
};

/**
 * getStorageIcon
 * Selects the icon for storage based on its name.
 * @param {string} name - Storage name
 * @returns {JSX.Element}
 */
function getStorageIcon(name) {
    if (!name) return <PiSelectionForegroundBold className={styles.storageIcon} />;
    const lower = name.toLowerCase();
    if (lower.includes("shelf") || lower.includes("shelves")) {
        return <MdShelves className={styles.storageIcon} />;
    }
    if (
        lower.includes("box") ||
        lower.includes("bin") ||
        lower.includes("boxes") ||
        lower.includes("bins")
    ) {
        return <FaBoxOpen className={styles.storageIcon} />;
    }
    if (lower.includes("cabinet") || lower.includes("cabinets")) {
        return <BiSolidCabinet className={styles.storageIcon} />;
    }
    if (lower.includes("office")) {
        return <PiOfficeChairBold className={styles.storageIcon} />;
    }
    return <PiSelectionForegroundBold className={styles.storageIcon} />;
}

/**
 * StorageInfoCard
 * Renders a single storage location card with dynamic icon selection.
 * @component
 * @param {object} props
 * @param {object} props.storage - Storage object ({ storageId, name, description, buildingId })
 * @param {function} [props.onClick] - Optional callback to trigger when the card is clicked (for edit).
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