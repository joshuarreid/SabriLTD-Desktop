import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./filterdropdown.module.css";

/**
 * logger for FilterDropdown.
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[FilterDropdown]", ...args),
    error: (...args) => console.error("[FilterDropdown]", ...args),
};

/**
 * FilterDropdown
 * Custom square dropdown used on JobScreen for "Sort by", "Company", and "Status".
 * Renders a button-like control and a fully styled option list (no native select menu).
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Left-side label text (e.g. "Company").
 * @param {Array<{value:string,label:string}>} props.options - Dropdown options.
 * @param {string} props.value - Currently selected value.
 * @param {(value:string)=>void} props.onChange - Called when the user selects a value.
 * @returns {JSX.Element}
 */
const FilterDropdown = ({ label, options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    /** Selected option object for display */
    const selectedOption =
        options.find((opt) => opt.value === value) || options[0];

    /**
     * Toggles the dropdown menu open/closed.
     *
     * @function handleToggle
     * @returns {void}
     */
    const handleToggle = () => {
        setOpen((prev) => !prev);
        logger.info("FilterDropdown toggled", { label, open: !open });
    };

    /**
     * Handles selecting an option.
     *
     * @function handleSelect
     * @param {string} nextValue
     * @returns {void}
     */
    const handleSelect = (nextValue) => {
        logger.info("FilterDropdown option selected", { label, value: nextValue });
        onChange(nextValue);
        setOpen(false);
    };

    /**
     * Closes dropdown on outside click when menu is open.
     *
     * @function
     * @returns {void}
     */
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    /**
     * Keyboard interaction for the control.
     *
     * @function handleKeyDown
     * @param {React.KeyboardEvent<HTMLButtonElement>} e
     * @returns {void}
     */
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
        }
        if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div ref={rootRef} className={styles.filterDropdownRoot}>
            <button
                type="button"
                className={styles.filterControl}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={styles.filterLabel}>{label}</span>
                <span className={styles.filterValueWrap}>
                    <span className={styles.filterValueText}>
                        {selectedOption?.label}
                    </span>
                    <span className={styles.filterCaret}>▾</span>
                </span>
            </button>

            {open && (
                <div
                    className={styles.filterMenu}
                    role="listbox"
                    aria-label={label}
                >
                    {options.map((opt) => {
                        const isActive = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                className={
                                    styles.filterMenuItem +
                                    (isActive ? " " + styles.filterMenuItemActive : "")
                                }
                                onClick={() => handleSelect(opt.value)}
                                role="option"
                                aria-selected={isActive}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

FilterDropdown.propTypes = {
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default FilterDropdown;