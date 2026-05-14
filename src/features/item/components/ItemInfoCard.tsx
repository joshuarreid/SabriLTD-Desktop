import React from "react";
import styles from "../styles/iteminfocard.module.css";
import ItemConditionPill from "./ItemConditionPill.tsx";
import ItemConditionDot from "./ItemConditionIcon.tsx";

/**
 * Logger for ItemInfoCard.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args: unknown[]) => console.log("[ItemInfoCard]", ...args),
    error: (...args: unknown[]) => console.error("[ItemInfoCard]", ...args),
};

export interface ItemInfoCardItem {
    itemId: number | string;
    name: string;
    price?: string;
    conditionName?: string | null;
    photoUrl?: string | null;
}

export interface ItemInfoCardProps {
    /** Normalized item preview data for display. */
    item: ItemInfoCardItem;
    /** Optional click handler invoked when the card is clicked. */
    onClick?: () => void;
}

/**
 * ItemInfoCard
 * Renders a single inventory item preview card with photo, name, price (optional),
 * and condition indicator. Intended for use inside paginated grids or search results.
 *
 * @component
 * @param {ItemInfoCardProps} props
 * @returns {JSX.Element}
 */
const ItemInfoCard: React.FC<ItemInfoCardProps> = ({ item, onClick }) => {
    const { itemId, name, price, conditionName, photoUrl } = item;

    /**
     * Handles card click events for logging and optional parent callback.
     *
     * @function handleClick
     * @returns {void}
     */
    const handleClick = () => {
        logger.info("ItemInfoCard clicked", { itemId, name });
        if (onClick) onClick();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={styles.cardRoot}
            aria-label={name}
        >
            <div className={styles.photoWrapper}>
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={name}
                        className={styles.photo}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.photoPlaceholder}>
                        <span className={styles.photoPlaceholderText}>
                            No photo
                        </span>
                    </div>
                )}
            </div>
            <div className={styles.meta}>
                <div className={styles.name} title={name}>
                    {name}
                </div>
                {price && (
                    <div className={styles.price}>${price}</div>
                )}
                <ItemConditionDot conditionName={conditionName ?? undefined} />
            </div>
        </button>
    );
};


export default ItemInfoCard;