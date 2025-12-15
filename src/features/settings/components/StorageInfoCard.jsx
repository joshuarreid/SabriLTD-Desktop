import React from "react";
import styles from "../styles/storageinfocard.module.css";
import { PiSelectionForegroundThin, PiOfficeChairBold } from "react-icons/pi";
import { MdShelves } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa";
import { BiSolidCabinet } from "react-icons/bi";
import { FaMinus } from "react-icons/fa";
import { FaMinusCircle } from "react-icons/fa";

/**
 * StorageInfoCard
 * Renders a single storage location card with dynamic icon selection and delete icon (no edit icon).
 *
 * @component
 * @param {object} props
 * @param {object} props.storage - Storage object ({ storageId, name, description })
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[StorageInfoCard]", ...args),
    error: (...args) => console.error("[StorageInfoCard]", ...args),
};

/**
 * getStorageIcon
 * Selects the icon for storage based on its name.
 *
 * @param {string} name - Storage name
 * @returns {JSX.Element}
 */
function getStorageIcon(name) {
    if (!name) return <PiSelectionForegroundThin className={styles.storageIcon} />;
    const lower = name.toLowerCase();
    if (lower.includes("shelf") || lower.includes("shelves")) {
        return <MdShelves className={styles.storageIcon} />;
    }
    if (lower.includes("box") || lower.includes("bin") || lower.includes("boxes") || lower.includes("bins")) {
        return <FaBoxOpen className={styles.storageIcon} />;
    }
    if (lower.includes("cabinet") || lower.includes("cabinets")) {
        return <BiSolidCabinet className={styles.storageIcon} />;
    }
    if (lower.includes("office")) {
        return <PiOfficeChairBold className={styles.storageIcon} />;
    }
    return <PiSelectionForegroundThin className={styles.storageIcon} />;
}

/**
 * StorageInfoCard
 * @param {object} props
 * @param {object} props.storage - Storage object
 * @returns {JSX.Element}
 */
const StorageInfoCard = ({ storage }) => {
    logger.info("StorageInfoCard rendered", { storageId: storage?.storageId });
    return (
        <div className={styles.storageCard}>
            <div className={styles.storageCardActions}>
                <button
                    type="button"
                    className={styles.storageCardActionBtn}
                    aria-label="Delete storage location"
                    tabIndex={0}
                >
                    <FaMinusCircle size={13} />
                </button>
            </div>
            <div className={styles.storageHeader}>
                <span className={styles.storageIconWrap}>
                    {getStorageIcon(storage.name)}
                </span>
                <span className={styles.storageName}>{storage.name}</span>
            </div>
            <div className={styles.storageDesc}>{storage.description}</div>
        </div>
    );
};

export default StorageInfoCard;