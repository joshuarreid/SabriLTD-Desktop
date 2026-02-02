import React from "react";
import PropTypes from "prop-types";
import styles from "../styles/iteminfocard.module.css";
import ItemConditionPill from "../../../components/itemconditionpill/ItemConditionPill";
import ItemConditionDot from "../../../components/itemconditionicon/ItemConditionIcon";

/**
 * logger for ItemInfoCard.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ItemInfoCard]", ...args),
    error: (...args) => console.error("[ItemInfoCard]", ...args),
};

/**
 * ItemInfoCard
 * - Renders an item card with a photo, name, price, and condition label.
 *
 * @component
 * @param {Object} props
 * @param {{
 *   itemId: number,
 *   name: string,
 *   price?: string,
 *   conditionName?: string|null,
 *   photoUrl?: string|null
 * }} props.item - Item data for display.
 * @param {()=>void} [props.onClick] - Optional click handler.
 * @returns {JSX.Element}
 */
const ItemInfoCard = ({ item, onClick }) => {
    const { itemId, name, price, conditionName, photoUrl } = item;

    /**
     * Handles card click events for logging and optional parent callback.
     *
     * @function
     */
    const handleClick = () => {
        logger.info("ItemInfoCard clicked", { itemId });
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
                <ItemConditionDot
                    conditionName={conditionName}
                />
            </div>
        </button>
    );
};

ItemInfoCard.propTypes = {
    item: PropTypes.shape({
        itemId: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.string, // New prop for price
        conditionName: PropTypes.string,
        photoUrl: PropTypes.string,
    }).isRequired,
    onClick: PropTypes.func,
};

ItemInfoCard.defaultProps = {
    onClick: undefined,
};

export default ItemInfoCard;