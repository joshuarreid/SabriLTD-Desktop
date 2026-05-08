import React from "react";
import styles from "../styles/buildinginfocard.module.css";
import { FcOrganization, FcInTransit } from "react-icons/fc";
import { GiHouse } from "react-icons/gi";
import { MdOutlineModeEditOutline } from "react-icons/md";

/**
 * Props for BuildingInfoCard
 */
export interface BuildingInfoCardProps {
    building: {
        buildingId: number;
        name: string;
        address?: string;
        manager?: string;
    };
    selected?: boolean;
    onClick?: () => void;
    onEdit?: (building: any) => void;
    showActions?: boolean;
    compact?: boolean;
}

/**
 * Returns an icon for the building card based on building name.
 */
function getBuildingIcon(name: string) {
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
 */
export const BuildingInfoCard: React.FC<BuildingInfoCardProps> = ({
    building,
    selected = false,
    onClick,
    onEdit,
    showActions = true,
    compact = false
}) => {
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
                {building.address && <div className={styles.buildingAddress}>{building.address}</div>}
            </div>
        </button>
    );
};

export default BuildingInfoCard;
