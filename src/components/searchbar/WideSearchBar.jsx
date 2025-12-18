import React from "react";
import styles from "./widesearchbar.module.css";
import { FiSearch } from "react-icons/fi";

/**
 * logger for WideSearchBar component.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[WideSearchBar]", ...args),
    error: (...args) => console.error("[WideSearchBar]", ...args),
};

/**
 * WideSearchBar
 * - Reusable full-width search input with leading search icon.
 * - Intentionally matches the card-wide search bar styling used in TagSettingsTab.
 *
 * @component
 * @param {Object} props
 * @param {string} props.value - Current search value.
 * @param {(event: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - Change handler for input.
 * @param {string} [props.placeholder="Search"] - Input placeholder text.
 * @param {boolean} [props.disabled=false] - Whether the search is disabled.
 * @param {string} [props.ariaLabel="Search"] - Accessible label for screen readers.
 * @returns {JSX.Element}
 */
const WideSearchBar = ({
                           value,
                           onChange,
                           placeholder = "Search",
                           disabled = false,
                           ariaLabel = "Search",
                       }) => {
    logger.info("WideSearchBar rendered", { disabled });

    return (
        <div className={styles.cardSearchTopBarWrap}>
            <label className={styles.cardSearchBarContainer}>
                <FiSearch size={25} className={styles.cardSearchIcon} />
                <input
                    type="search"
                    className={styles.cardSearchBar}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    aria-label={ariaLabel}
                    disabled={disabled}
                />
            </label>
        </div>
    );
};

export default WideSearchBar;