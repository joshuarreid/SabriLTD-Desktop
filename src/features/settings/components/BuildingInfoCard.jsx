import React from "react";
import styles from "../styles/buildinginfocard.module.css";
import { LuWarehouse } from "react-icons/lu";
import { MdOutlineModeEditOutline } from "react-icons/md";

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
const logger = {
    info: (...args) => console.log("[BuildingInfoCard]", ...args),
    error: (...args) => console.error("[BuildingInfoCard]", ...args),
};

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
                <LuWarehouse className={styles.buildingIcon} />
            </div>
            <div className={styles.buildingInfo}>
                <div className={styles.buildingName}>{building.name}</div>
                <div className={styles.buildingAddress}>{building.address}</div>
                <div className={styles.buildingManager}>
                    <span className={styles.managerLabel}>Manager:</span>{" "}
                    <span>{building.manager}</span>
                </div>
            </div>
        </button>
    );
};

export default BuildingInfoCard;