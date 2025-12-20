import React, { useState, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";
import styles from "./filterdropdownsearch.module.css";

/**
 * logger for FilterDropdownSearch component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[FilterDropdownSearch]", ...args),
    error: (...args) => console.error("[FilterDropdownSearch]", ...args),
};

/**
 * FilterDropdownSearch
 *
 * Variant of FilterDropdown specialized for job / entity selection:
 * - Trigger button matches FilterDropdown styling.
 * - Menu opens with a search input as the first row.
 * - Initially shows only the first 5 most recently updated options (caller provides sorted list).
 * - Typing in the search input filters the list client-side.
 *
 * NOTE:
 * - This component is UI-only; fetching and sorting should be handled by a hook.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Title/label for the control (e.g., "Company").
 * @param {Array<{value:string,label:string}>} props.options - Options, already sorted by most‑recent first.
 * @param {string} props.value - Currently selected value or "" when none is selected.
 * @param {(value:string)=>void} props.onChange - Called when user selects a value.
 * @param {string} [props.className] - Optional extra className for root wrapper.
 * @param {string} [props.emptyLabel="No options found"] - Text shown when no options match.
 * @returns {JSX.Element}
 */
const FilterDropdownSearch = ({
                                  label,
                                  options,
                                  value,
                                  onChange,
                                  className,
                                  emptyLabel = "No options found",
                              }) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const rootRef = useRef(null);
    const searchInputRef = useRef(null);

    /**
     * hasSelection
     * - True when a non-empty value is selected.
     *
     * @type {boolean}
     */
    const hasSelection = Boolean(value);

    /**
     * selectedLabel
     * - Label of currently selected option (if any).
     *
     * @type {string}
     */
    const selectedLabel = useMemo(() => {
        const match = options.find((opt) => opt.value === value);
        return match?.label || "";
    }, [options, value]);

    /**
     * visibleOptions
     * - Options currently visible in the dropdown based on searchTerm.
     * - If searchTerm is blank, only the first 5 options are shown.
     *
     * @type {Array<{value:string,label:string}>}
     */
    const visibleOptions = useMemo(() => {
        if (!Array.isArray(options) || options.length === 0) {
            return [];
        }
        const trimmed = searchTerm.trim().toLowerCase();
        if (!trimmed) {
            return options.slice(0, 5);
        }
        return options.filter((opt) =>
            String(opt.label || "")
                .toLowerCase()
                .includes(trimmed),
        );
    }, [options, searchTerm]);

    /**
     * handleToggle
     * - Opens/closes the dropdown.
     *
     * @function handleToggle
     * @returns {void}
     */
    const handleToggle = () => {
        setOpen((prev) => !prev);
        logger.info("FilterDropdownSearch toggled", { label, open: !open });
    };

    /**
     * handleSelect
     * - Handles selecting an option.
     *
     * @function handleSelect
     * @param {string} nextValue
     * @returns {void}
     */
    const handleSelect = (nextValue) => {
        logger.info("FilterDropdownSearch option selected", { label, value: nextValue });
        onChange(nextValue);
        setOpen(false);
    };

    /**
     * handleClickOutside
     * - Closes dropdown when clicking outside.
     *
     * @function handleClickOutside
     * @param {MouseEvent} event
     * @returns {void}
     */
    const handleClickOutside = (event) => {
        if (rootRef.current && !rootRef.current.contains(event.target)) {
            setOpen(false);
        }
    };

    /**
     * Effect: attach/detach outside click listener when menu is open.
     */
    useEffect(() => {
        if (!open) return;
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    /**
     * Effect: focus search input when opening the menu.
     */
    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [open]);

    /**
     * handleKeyDown
     * - Keyboard interactions for the trigger button.
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
        hasSelection ? styles.filterControlActive : "",
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
                        (hasSelection ? ` ${styles.filterLabelActive}` : "")
                    }
                >
                    {label.toUpperCase()}
                </span>
                {/* When a value is selected, show it below the title to make it obvious */}
                {hasSelection && (
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
                    {/* Search row */}
                    <div className={styles.searchRow}>
                        <FiSearch
                            size={14}
                            className={styles.searchIcon}
                            aria-hidden="true"
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search"
                        />
                    </div>

                    {/* Divider */}
                    <div className={styles.menuDivider} />

                    {/* Options */}
                    {visibleOptions.length === 0 ? (
                        <div className={styles.emptyRow}>{emptyLabel}</div>
                    ) : (
                        visibleOptions.map((opt) => {
                            const isActive = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={
                                        styles.filterMenuItem +
                                        (isActive
                                            ? ` ${styles.filterMenuItemActive}`
                                            : "")
                                    }
                                    onClick={() => handleSelect(opt.value)}
                                    role="option"
                                    aria-selected={isActive}
                                >
                                    {opt.label}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

FilterDropdownSearch.propTypes = {
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
    emptyLabel: PropTypes.string,
};

FilterDropdownSearch.defaultProps = {
    className: "",
    emptyLabel: "No jobs found",
};

export default FilterDropdownSearch;