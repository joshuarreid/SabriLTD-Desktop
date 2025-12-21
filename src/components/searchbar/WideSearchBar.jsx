import React from "react";
import styles from "./widesearchbar.module.css";
import { FiSearch } from "react-icons/fi";

/**
 * logger for WideSearchBar component.
 *
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
 * - Default layout centers the bar with a max-width (legacy behavior).
 * - When `fluid` is true, the bar stretches to fill its container width.
 *
 * @component
 * @param {Object} props
 * @param {string} props.value - Current search value.
 * @param {(event: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - Change handler for input.
 * @param {(event: React.KeyboardEvent<HTMLInputElement>) => void} [props.onKeyDown] - Optional keydown handler (e.g. Enter to create).
 * @param {string} [props.placeholder="Search"] - Input placeholder text.
 * @param {boolean} [props.disabled=false] - Whether the search is disabled.
 * @param {string} [props.ariaLabel="Search"] - Accessible label for screen readers.
 * @param {boolean} [props.fluid=false] - If true, uses a full-width, left-aligned layout instead of centered/95% width.
 * @param {string} [props.className] - Optional additional className applied to the outer wrapper.
 * @returns {JSX.Element}
 */
const WideSearchBar = ({
                           value,
                           onChange,
                           onKeyDown,
                           placeholder = "Search",
                           disabled = false,
                           ariaLabel = "Search",
                           fluid = false,
                           className = "",
                       }) => {
    logger.info("WideSearchBar rendered", { disabled, fluid });

    /**
     * Computes the outer wrapper className, supporting both legacy and fluid modes.
     *
     * @constant
     * @type {string}
     */
    const wrapperClassName = [
        styles.cardSearchTopBarWrap,
        fluid ? styles.cardSearchTopBarWrapFluid : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    // NOTE: onKeyDown is forwarded so parents (e.g. TagSettingsTab, JobScreen) can handle Enter.
    return (
        <div className={wrapperClassName}>
            <label className={styles.cardSearchBarContainer}>
                <FiSearch size={25} className={styles.cardSearchIcon} />
                <input
                    type="search"
                    className={styles.cardSearchBar}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    aria-label={ariaLabel}
                    disabled={disabled}
                />
            </label>
        </div>
    );
};

export default WideSearchBar;