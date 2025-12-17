import React from "react";
import styles from "../styles/categoryinfopill.module.css";
import { FcRating, FcFrame, FcServices, FcStackOfPhotos, FcPackage, FcAdvertising, FcOpenedFolder } from "react-icons/fc";
import { LiaChairSolid, LiaToolsSolid } from "react-icons/lia";
import { GiWoodFrame, GiScrew } from "react-icons/gi";
import { PiToolboxDuotone } from "react-icons/pi";

/**
 * Returns the icon/emoji for a given category name (customized for known category types).
 *
 * @param {string} label - Category display name.
 * @param {string} [emoji] - Fallback emoji from API.
 * @returns {JSX.Element|string|null}
 */
function getIconForCategory(label, emoji) {
    const lower = label.toLowerCase();

    if (lower.includes("brand"))          return <FcRating className={styles.icon} />;
    if (lower.includes("displays"))       return <FcFrame className={styles.icon} />;
    if (lower.includes("furniture"))      return <LiaChairSolid className={styles.icon} style={{ color: "#965E2F" }} />;
    if (lower.includes("raw materials"))  return <GiWoodFrame className={styles.icon} style={{ color: "#965E2F" }} />;
    if (lower.includes("components"))     return <FcServices className={styles.icon} />;
    if (lower.includes("fasteners"))      return <GiScrew className={styles.icon} style={{ color: "grey"}} />;
    if (lower.includes("graphics"))       return <FcStackOfPhotos className={styles.icon} />;
    if (lower.includes("tools"))          return <LiaToolsSolid className={styles.icon} style={{ color: "grey" }} />;
    if (lower.includes("shipping"))       return <FcPackage className={styles.icon} />;
    if (lower.includes("event"))          return <FcAdvertising className={styles.icon} />;
    if (lower.includes("maintainence") || lower.includes("maintenance"))
        return <PiToolboxDuotone className={styles.icon} style={{ color: "grey" }} />;
    if (lower.includes("archive"))        return <FcOpenedFolder className={styles.icon} />;

    // fallback: use emoji string provided by API if available, else nothing.
    if (emoji) return <span className={styles.emoji}>{emoji}</span>;
    return null;
}

/**
 * CategoryInfoPill
 * - Renders a single category pill with icon/emoji.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Category display name.
 * @param {string} [props.emoji] - Emoji/icon for the category.
 * @param {boolean} [props.active] - Whether the pill is selected.
 * @param {Function} [props.onClick] - Click handler for the pill.
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log("[CategoryInfoPill]", ...args),
    error: (...args) => console.error("[CategoryInfoPill]", ...args),
};

const CategoryInfoPill = ({ label, emoji, active = false, onClick }) => {
    logger.info("CategoryInfoPill rendered", label, { active });
    return (
        <button
            className={
                `${styles.pill} ${active ? styles.pillActive : ""}`
            }
            type="button"
            onClick={onClick}
        >
            {getIconForCategory(label, emoji)}
            <span className={styles.label}>{label}</span>
        </button>
    );
};

export default CategoryInfoPill;