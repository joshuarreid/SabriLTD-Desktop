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
 * buildPinnedAndRemainingOptions
 * - Derives a pinned "current selection" option (if any) and the remaining options.
 * - Pinned option is the one matching the current value.
 *
 * @function buildPinnedAndRemainingOptions
 * @param {Array<{value:string,label:string}>} options
 * @param {string} value
 * @returns {{ pinned: {value:string,label:string}|null, rest: Array<{value:string,label:string}> }}
 */
const buildPinnedAndRemainingOptions = (options, value) => {
    if (!Array.isArray(options) || options.length === 0) {
        return { pinned: null, rest: [] };
    }

    if (!value) {
        return { pinned: null, rest: options };
    }

    const pinned = options.find((opt) => opt.value === value) || null;
    const rest = pinned
        ? options.filter((opt) => opt.value !== pinned.value)
        : options;

    return { pinned, rest };
};

/**
 * FilterDropdownSearch
 *
 * Variant of FilterDropdown specialized for job / entity selection:
 * - Trigger button matches FilterDropdown styling.
 * - Menu opens with a search input as the first row.
 * - Initially shows only the first 5 most recently updated options (caller provides sorted list).
 * - Typing in the search input filters the list client-side.
 * - When a value is selected:
 *   - The selected value is shown next to the label on the trigger.
 *   - Inside the menu, the selected option is pinned at the top
 *     with a "Clear" button to remove the filter.
 *
 * NOTE:
 * - This component is UI-only; fetching and sorting should be handled by a hook.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Title/label for the control (e.g., "Client", "Company").
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
     * pinned + rest
     * - Pinned selected option and remaining options for the menu.
     */
    const { pinned, rest } = useMemo(
        () => buildPinnedAndRemainingOptions(options, value),
        [options, value],
    );

    /**
     * visibleOptions
     * - Options currently visible in the dropdown based on searchTerm.
     * - If searchTerm is blank, only the first 5 "rest" options are shown
     *   (the pinned option, if any, is rendered separately above).
     *
     * @type {Array<{value:string,label:string}>}
     */
    const visibleOptions = useMemo(() => {
        if (!Array.isArray(rest) || rest.length === 0) {
            return [];
        }
        const trimmed = searchTerm.trim().toLowerCase();
        if (!trimmed) {
            return rest.slice(0, 5);
        }
        return rest.filter((opt) =>
            String(opt.label || "")
                .toLowerCase()
                .includes(trimmed),
        );
    }, [rest, searchTerm]);

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
     * handleClear
     * - Clears the current selection.
     *
     * @function handleClear
     * @returns {void}
     */
    const handleClear = () => {
        logger.info("FilterDropdownSearch selection cleared", { label });
        onChange("");
        // keep menu open so user can immediately re-select
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

    /**
     * searchPlaceholder
     * - Contextual placeholder text based on the dropdown label.
     *   Example: label "Client" -> "Search Clients".
     *
     * @type {string}
     */
    const searchPlaceholder = useMemo(() => {
        const base = label.trim();
        if (!base) return "Search";
        const plural =
            base.toLowerCase().endsWith("y")
                ? `${base.slice(0, -1)}ies`
                : `${base}s`;
        return `Search ${plural}`;
    }, [label]);

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
                            size={16}
                            className={styles.searchIcon}
                            aria-hidden="true"
                        />
                        <input
                            ref={searchInputRef}
                            type="search"
                            className={styles.searchInput}
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label={searchPlaceholder}
                        />
                    </div>

                    {/* Pinned current selection row with clear button */}
                    {pinned && (
                        <div className={styles.pinnedRow}>
                            <button
                                type="button"
                                className={`${styles.filterMenuItem} ${styles.filterMenuItemActive}`}
                                onClick={() => handleSelect(pinned.value)}
                                role="option"
                                aria-selected
                            >
                                {pinned.label}
                            </button>
                            <button
                                type="button"
                                className={styles.pinnedClearButton}
                                onClick={handleClear}
                            >
                                Clear
                            </button>
                        </div>
                    )}

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
    emptyLabel: "No results found",
};

export default FilterDropdownSearch;