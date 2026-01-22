import React from "react";
import styles from "./buildinginfocard.module.css";
import { FcOrganization } from "react-icons/fc";
import { FcInTransit } from "react-icons/fc";
import { GiHouse } from "react-icons/gi";
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
 * Returns an icon for the building card based on building name.
 *
 * @function getBuildingIcon
 * @param {string} name
 * @returns {JSX.Element}
 */
function getBuildingIcon(name) {
    if (!name) return <FcOrganization className={styles.buildingIcon} />;
    const lower = name.toLowerCase();
    if (lower.includes("warehouse")) {
        return <FcOrganization className={styles.buildingIcon} />;
    }
    if (
        lower.includes("van") ||
        lower.includes("truck") ||
        lower.includes("car") ||
        lower.includes("vehicle")
    ) {
        return <FcInTransit className={styles.buildingIcon} />;
    }
    if (
        lower.includes("home") ||
        lower.includes("house")
    ) {
        return <GiHouse className={styles.buildingIcon} />;
    }
    return <FcOrganization className={styles.buildingIcon} />;
}

/**
 * BuildingInfoCard
 * Renders a building card.
 *
 * @component
 * @param {object} props
 * @param {object} props.building - Building object ({ buildingId, name, address, manager })
 * @param {boolean} props.selected - Is this building selected
 * @param {function} [props.onClick] - Card click handler (optional)
 * @param {function} [props.onEdit] - (Optional) Edit callback for this building
 * @param {boolean} [props.showActions=true] - Show edit pencil (default: true)
 * @param {boolean} [props.compact=false] - Render compact/small for use in forms (default: false)
 * @returns {JSX.Element}
 */
const BuildingInfoCard = ({
                              building,
                              selected,
                              onClick,
                              onEdit,
                              showActions = true,
                              compact = false
                          }) => {
    logger.info("BuildingInfoCard rendered", {
        buildingId: building?.buildingId,
        selected,
        showActions,
        compact
    });

    // Merge classnames for compact mode
    const rootClass = [
        styles.buildingCard,
        selected ? styles.selectedCard : "",
        compact ? styles.compact : ""
    ].join(" ");

    return (
        <button
            type="button"
            className={rootClass}
            onClick={onClick}
            aria-label={
                selected
                    ? `Building ${building.name}, selected`
                    : `Building ${building.name}`
            }
            tabIndex={0}
        >
            {showActions && (
                <div className={styles.buildingCardActions}>
                    <button
                        type="button"
                        className={styles.buildingCardActionBtn}
                        aria-label="Edit building"
                        tabIndex={0}
                        onClick={e => {
                            e.stopPropagation();
                            if (onEdit) onEdit(building);
                        }}
                    >
                        <MdOutlineModeEditOutline size={18} />
                    </button>
                </div>
            )}
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