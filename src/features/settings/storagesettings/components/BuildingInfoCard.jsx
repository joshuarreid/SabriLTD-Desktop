import React from "react";
import styles from "../styles/buildinginfocard.module.css";
import { LuWarehouse } from "react-icons/lu";
import { FaHouse } from "react-icons/fa6";
import { FaVanShuttle } from "react-icons/fa6";
import { MdOutlineModeEditOutline } from "react-icons/md";

/**
 * logger for BuildingInfoCard.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[BuildingInfoCard]", ...args),
    error: (...args) => console.error("[BuildingInfoCard]", ...args),
};

/**
 * Selects an icon for the building card based on building name.
 *
 * - Returns the warehouse icon for names including "warehouse", or if name is blank/absent.
 * - Returns the van icon for names including "van", "truck", "car", or "vehicle".
 * - Returns the house icon for names including "home" or "house".
 * - Defaults to warehouse icon otherwise.
 *
 * @function getBuildingIcon
 * @param {string} name - Building name
 * @returns {JSX.Element}
 */
function getBuildingIcon(name) {
    if (!name) return <LuWarehouse className={styles.buildingIcon} />;
    const lower = name.toLowerCase();
    if (lower.includes("warehouse")) {
        return <LuWarehouse className={styles.buildingIcon} />;
    }
    if (
        lower.includes("van") ||
        lower.includes("truck") ||
        lower.includes("car") ||
        lower.includes("vehicle")
    ) {
        return <FaVanShuttle className={styles.buildingIcon} />;
    }
    if (
        lower.includes("home") ||
        lower.includes("house")
    ) {
        return <FaHouse className={styles.buildingIcon} />;
    }
    return <LuWarehouse className={styles.buildingIcon} />;
}

/**
 * BuildingInfoCard
 * Renders a single building card with icon, meta, and edit button.
 *
 * @component
 * @param {object} props
 * @param {object} props.building - Building object ({ buildingId, name, address, manager })
 * @param {boolean} props.selected - Is this building selected
 * @param {function} props.onClick - Callback when card is clicked
 * @param {function} [props.onEdit] - (Optional) Edit callback for this building
 * @returns {JSX.Element}
 */
const BuildingInfoCard = ({ building, selected, onClick, onEdit }) => {
    logger.info("BuildingInfoCard rendered", { buildingId: building?.buildingId, selected });
    return (
        <button
            type="button"
            className={
                styles.buildingCard +
                (selected ? " " + styles.selectedCard : "")
            }
            onClick={onClick}
            aria-label={
                selected
                    ? `Building ${building.name}, selected`
                    : `Building ${building.name}`
            }
        >
            <div className={styles.buildingCardActions}>
                <button
                    type="button"
                    className={styles.buildingCardActionBtn}
                    aria-label="Edit building"
                    tabIndex={0}
                    // Prevent bubbling to onClick select logic
                    onClick={e => {
                        e.stopPropagation();
                        if (onEdit) onEdit(building);
                    }}
                >
                    <MdOutlineModeEditOutline size={18} />
                </button>
            </div>
            <div className={styles.buildingIconWrap}>
                {getBuildingIcon(building.name)}
            </div>
            <div className={styles.buildingInfo}>
                <div className={styles.buildingName}>{building.name}</div>
            </div>
        </button>
    );
};

export default BuildingInfoCard;