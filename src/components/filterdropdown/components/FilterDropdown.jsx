import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "../styles/filterdropdown.module.css";

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
 * findOptionLabel
 * - Returns the label for the current value, or null if not found.
 *
 * @function findOptionLabel
 * @param {Array<{value:string,label:string}>} options
 * @param {string} value
 * @returns {string|null}
 */
const findOptionLabel = (options, value) => {
    const match = (options || []).find((opt) => opt.value === value);
    return match ? match.label : null;
};

/**
 * FilterDropdown
 * Generic square dropdown used for filter/sort controls.
 *
 * Behavior:
 * - Base chrome (padding, radius, shadows, colors) is aligned with FilterDropdownSearch
 *   so all filter controls look consistent.
 * - By default, the button shows ONLY the section label (e.g., "STATUS").
 * - When `displaySelection` is true and a non-all value is selected,
 *   the current selection label is shown next to the section label,
 *   matching the FilterDropdownSearch UX.
 * - Label and button chrome become stronger when a non-all value is selected.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Title/label for the control (e.g., "Status").
 * @param {Array<{value:string,label:string}>} props.options - Dropdown options.
 * @param {string} props.value - Currently selected option value.
 * @param {(value:string)=>void} props.onChange - Called when user selects a value.
 * @param {string} [props.className] - Optional extra className for root wrapper.
 * @param {string} [props.allValue="all"] - Sentinel value that means "no filter".
 * @param {boolean} [props.displaySelection=false]
 *   - When true, renders the current selection label alongside the section label.
 *   - For legacy usage where prop is not passed, this defaults to false.
 * @returns {JSX.Element}
 */
const FilterDropdown = ({
                            label,
                            options,
                            value,
                            onChange,
                            className,
                            allValue = "all",
                            displaySelection = false,
                        }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    /**
     * Whether a "real" filter is applied (current value is not the sentinel).
     *
     * @type {boolean}
     */
    const hasActiveFilter = value !== allValue;

    /**
     * The label for the currently selected option (if any).
     *
     * @type {string|null}
     */
    const selectedLabel = hasActiveFilter
        ? findOptionLabel(options, value)
        : null;

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
     * Closes dropdown when a click occurs outside of this component.
     *
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
     * Keyboard interactions for the trigger button.
     *
     * @function handleKeyDown
     * @param {React.KeyboardEvent<HTMLButtonElement>} event
     * @returns {void}
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

    const controlClassName = [
        styles.filterControl,
        hasActiveFilter ? styles.filterControlActive : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            ref={rootRef}
            className={`${styles.filterDropdownRoot}${className ? ` ${className}` : ""}`}
        >
            <button
                type="button"
                className={controlClassName}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span
                    className={
                        styles.filterLabel +
                        (hasActiveFilter ? ` ${styles.filterLabelActive}` : "")
                    }
                >
                    {label.toUpperCase()}
                </span>

                {displaySelection && hasActiveFilter && selectedLabel && (
                    <span className={styles.filterSelectedValue}>
                        {selectedLabel}
                    </span>
                )}

                <span className={styles.filterCaret}>▾</span>
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
        }),
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    allValue: PropTypes.string,
    displaySelection: PropTypes.bool,
};

FilterDropdown.defaultProps = {
    className: "",
    allValue: "all",
    displaySelection: false,
};

export default FilterDropdown;