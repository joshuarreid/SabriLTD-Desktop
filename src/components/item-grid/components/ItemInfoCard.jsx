import React from "react";
import PropTypes from "prop-types";
import styles from "../styles/iteminfocard.module.css";
import ItemConditionPill from "../../itemconditionpill/ItemConditionPill";
import ItemConditionDot from "../../itemconditionicon/ItemConditionIcon";

/**
 * Logger for ItemInfoCard.
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
 * Renders a single inventory item preview card with photo, name, price (optional),
 * and condition indicator. Intended for use inside paginated grids or search results.
 *
 * @component
 * @param {Object} props
 * @param {{
 *   itemId: number,
 *   name: string,
 *   price?: string,
 *   conditionName?: string|null,
 *   photoUrl?: string|null
 * }} props.item - Normalized item preview data for display.
 * @param {Function} [props.onClick] - Optional click handler invoked when the card is clicked.
 * @returns {JSX.Element}
 */
const ItemInfoCard = ({ item, onClick }) => {
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
                <ItemConditionDot conditionName={conditionName} />
            </div>
        </button>
    );
};

ItemInfoCard.propTypes = {
    item: PropTypes.shape({
        itemId: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        conditionName: PropTypes.string,
        photoUrl: PropTypes.string,
    }).isRequired,
    onClick: PropTypes.func,
};

ItemInfoCard.defaultProps = {
    onClick: undefined,
};

export default ItemInfoCard;