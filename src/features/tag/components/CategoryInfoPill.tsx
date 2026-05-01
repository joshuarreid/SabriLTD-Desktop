import React from "react";
import styles from "../styles/categoryinfopill.module.css";
import * as FcIcons from "react-icons/fc";
import * as LiaIcons from "react-icons/lia";
import * as GiIcons from "react-icons/gi";
import * as PiIcons from "react-icons/pi";

interface CategoryInfoPillProps {
    label: string;
    emoji?: string;
    active?: boolean;
    onClick?: () => void;
}

/**
 * Returns the icon/emoji for a given category name (customized for known category types).
 *
 * @param {string} label - Category display name.
 * @param {string} [emoji] - Fallback emoji from API.
 * @returns {JSX.Element|string|null}
 */
function getIconForCategory(label: string, emoji?: string): React.ReactNode {
    const lower = label.toLowerCase();

    if (lower.includes("brand"))          return <FcIcons.FcRating className={styles.icon} />;
    if (lower.includes("displays"))       return <FcIcons.FcFrame className={styles.icon} />;
    if (lower.includes("furniture"))      return <LiaIcons.LiaChairSolid className={`${styles.icon} ${styles.iconBrown}`} />;
    if (lower.includes("raw materials"))  return <GiIcons.GiWoodFrame className={`${styles.icon} ${styles.iconBrown}`} />;
    if (lower.includes("components"))     return <FcIcons.FcServices className={styles.icon} />;
    if (lower.includes("fasteners"))      return <GiIcons.GiScrew className={`${styles.icon} ${styles.iconGrey}`} />;
    if (lower.includes("graphics"))       return <FcIcons.FcStackOfPhotos className={styles.icon} />;
    if (lower.includes("tools"))          return <LiaIcons.LiaToolsSolid className={`${styles.icon} ${styles.iconGrey}`} />;
    if (lower.includes("av equipment"))   return <FcIcons.FcCamcorderPro className={`${styles.icon} ${styles.iconGrey}`} />;
    if (lower.includes("shipping"))       return <FcIcons.FcPackage className={styles.icon} />;
    if (lower.includes("event"))          return <FcIcons.FcAdvertising className={styles.icon} />;
    if (lower.includes("maintainence") || lower.includes("maintenance"))
        return <PiIcons.PiToolboxDuotone className={`${styles.icon} ${styles.iconGrey}`} />;
    if (lower.includes("archive"))        return <FcIcons.FcOpenedFolder className={styles.icon} />;
    if (emoji) return <span className={styles.emoji}>{emoji}</span>;
    return null;
}

const logger = {
    info: (...args: unknown[]) => console.log("[CategoryInfoPill]", ...args),
    error: (...args: unknown[]) => console.error("[CategoryInfoPill]", ...args),
};

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
const CategoryInfoPill: React.FC<CategoryInfoPillProps> = ({ label, emoji, active = false, onClick }) => {
    logger.info("CategoryInfoPill rendered", { label, active });
    return (
        <span
            className={`${styles.pill} ${active ? styles.pillActive : ""}`}
            tabIndex={0}
            role="button"
            onClick={onClick}
        >
            {getIconForCategory(label, emoji)}
            <span className={styles.pillLabel}>{label}</span>
        </span>
    );
};

export default CategoryInfoPill;