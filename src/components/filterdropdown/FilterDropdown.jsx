import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./filterdropdown.module.css";

/**
 * logger for FilterDropdown component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[FilterDropdown]", ...args),
    error: (...args) => console.error("[FilterDropdown]", ...args),
};

/**
 * FilterDropdown
 *
 * Generic, square-styled dropdown used for filter/sort controls across the app.
 * - Pure presentational, no external side‑effects.
 * - Fully controlled via `value` and `onChange`.
 * - Renders a button-style trigger and a custom styled list of options.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Left-side label text (e.g. "Sort by", "Company").
 * @param {Array<{value:string,label:string}>} props.options - Options for the dropdown.
 * @param {string} props.value - Currently selected option value.
 * @param {(value:string)=>void} props.onChange - Called when user selects an option.
 * @param {string} [props.className] - Optional extra className to attach to root wrapper.
 * @returns {JSX.Element}
 */
const FilterDropdown = ({ label, options, value, onChange, className }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    /** Selected option object for display. */
    const selectedOption =
        options.find((opt) => opt.value === value) || options[0];

    /**
     * Toggles the dropdown menu open/closed.
     *
     * @function handleToggle
     */
    const handleToggle = () => {
        setOpen((prev) => !prev);
        logger.info("FilterDropdown toggled", {
            label,
            open: !open,
        });
    };

    /**
     * Handles selecting an option.
     *
     * @function handleSelect
     * @param {string} nextValue
     */
    const handleSelect = (nextValue) => {
        logger.info("FilterDropdown option selected", {
            label,
            value: nextValue,
        });
        onChange(nextValue);
        setOpen(false);
    };

    /**
     * Closes dropdown when a click occurs outside of this component.
     *
     * @function useEffect
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
     * Keyboard interactions for the trigger button.
     *
     * @function handleKeyDown
     * @param {React.KeyboardEvent<HTMLButtonElement>} event
     */
    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleToggle();
        }
        if (event.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div
            ref={rootRef}
            className={`${styles.filterDropdownRoot}${
                className ? ` ${className}` : ""
            }`}
        >
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
                                    (isActive ? ` ${styles.filterMenuItemActive}` : "")
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
    className: PropTypes.string,
};

FilterDropdown.defaultProps = {
    className: "",
};

export default FilterDropdown;