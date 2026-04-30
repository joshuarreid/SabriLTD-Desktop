import React, { useState, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FiSearch, FiPlus } from "react-icons/fi";
import styles from "./filterdropdownsearchandadd.module.css";

/**
 * Logger for FilterDropdownSearchAndAdd component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[FilterDropdownSearchAndAdd]", ...args),
    error: (...args) => console.error("[FilterDropdownSearchAndAdd]", ...args),
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
    const rest = pinned ? options.filter((opt) => opt.value !== pinned.value) : options;

    return { pinned, rest };
};

/**
 * getSearchPlaceholder
 * - Builds a contextual placeholder string based on label.
 *   Example: "Client" -> "Search Clients"
 *
 * @function getSearchPlaceholder
 * @param {string} label
 * @returns {string}
 */
const getSearchPlaceholder = (label) => {
    if (!label) return "Search";
    const base = String(label).trim();
    if (!base) return "Search";
    const plural =
        base.toLowerCase().endsWith("y") ? `${base.slice(0, -1)}ies` : `${base}s`;
    return `Search ${plural}`;
};

/**
 * FilterDropdownSearchAndAdd
 *
 * Searchable dropdown with optional create/add flow:
 * - Trigger button matches textbox sizing via parent (.jobFieldDropdownInline > button)
 * - Menu opens with a search input as the first row.
 * - Initially shows only the first 5 most recently updated options (caller provides sorted list).
 * - Typing in the search input filters the list client-side.
 * - When a value is selected:
 *   - The selected value is shown inside the trigger.
 *   - Inside the menu, the selected option is pinned at the top
 *     with a "Clear" button to remove the filter.
 * - Supports creating new options when no exact match is found via onCreateNew callback.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Title/label for the control (e.g., "Client", "Company").
 * @param {Array<{value:string,label:string}>} props.options - Options, already sorted by most‑recent first.
 * @param {string} props.value - Currently selected value or "" when none is selected.
 * @param {(value:string)=>void} props.onChange - Called when user selects a value.
 * @param {string} [props.className] - Optional extra className for root wrapper.
 * @param {string} [props.emptyLabel="No options found"] - Text shown when no options match.
 * @param {(name:string)=>void} props.onCreateNew - Callback to create a new option when not found.
 * @param {string} [props.createNewLabel="Create new"] - Label for the create new button.
 * @param {boolean} [props.allowCreateNew=true] - Whether to show the create new option.
 * @returns {JSX.Element}
 */
const FilterDropdownSearchAndAdd = ({
                                        label,
                                        options,
                                        value,
                                        onChange,
                                        className,
                                        emptyLabel = "No options found",
                                        onCreateNew,
                                        createNewLabel = "Create new",
                                        allowCreateNew = true,
                                    }) => {
    /**
     * open
     * - True when the dropdown menu is open.
     *
     * @type {boolean}
     */
    const [open, setOpen] = useState(false);

    /**
     * searchTerm
     * - Current user-typed search term.
     *
     * @type {string}
     */
    const [searchTerm, setSearchTerm] = useState("");

    /**
     * rootRef
     * - Ref used to detect outside clicks for closing.
     *
     * @type {React.RefObject<HTMLDivElement|null>}
     */
    const rootRef = useRef(null);

    /**
     * searchInputRef
     * - Ref to focus search input on open.
     *
     * @type {React.RefObject<HTMLInputElement|null>}
     */
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
        if (!Array.isArray(rest) || rest.length === 0) return [];
        const trimmed = searchTerm.trim().toLowerCase();
        if (!trimmed) return rest.slice(0, 5);

        return rest.filter((opt) =>
            String(opt.label || "").toLowerCase().includes(trimmed),
        );
    }, [rest, searchTerm]);

    /**
     * showCreateNewOption
     * - Show the "Create new" option when:
     *   1. onCreateNew callback is provided
     *   2. allowCreateNew is true
     *   3. user has typed something in the search
     *   4. No exact match exists in options
     *
     * @type {boolean}
     */
    const showCreateNewOption = useMemo(() => {
        if (!onCreateNew || !allowCreateNew) return false;
        const trimmed = searchTerm.trim();
        if (!trimmed) return false;

        const hasExactMatch = options.some(
            (opt) => String(opt.label || "").toLowerCase() === trimmed.toLowerCase(),
        );

        return !hasExactMatch;
    }, [onCreateNew, allowCreateNew, searchTerm, options]);

    /**
     * handleCreateNew
     * - Creates a new option using the current search term.
     *
     * @function handleCreateNew
     * @returns {void}
     */
    const handleCreateNew = () => {
        const trimmed = searchTerm.trim();
        if (!trimmed || !onCreateNew) return;

        logger.info("Creating new option", { label, value: trimmed });
        onCreateNew(trimmed);

        setSearchTerm("");
        setOpen(false);
    };

    /**
     * handleToggle
     * - Opens/closes the dropdown.
     *
     * @function handleToggle
     * @returns {void}
     */
    const handleToggle = () => {
        setOpen((prev) => !prev);
        logger.info("Dropdown toggled", { label, open: !open });
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
        logger.info("Option selected", { label, value: nextValue });
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
        logger.info("Selection cleared", { label });
        onChange("");
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

    /**
     * controlClassName
     * - Computed trigger class names.
     *
     * @type {string}
     */
    const controlClassName = [
        styles.filterControl,
        hasSelection ? styles.filterControlActive : "",
    ]
        .filter(Boolean)
        .join(" ");

    /**
     * searchPlaceholder
     * - Contextual placeholder text based on the dropdown label.
     *
     * @type {string}
     */
    const searchPlaceholder = useMemo(() => getSearchPlaceholder(label), [label]);

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
                {/* Match the rest of the form: show value only, not duplicated COMPANY/CLIENT text */}
                <span className={styles.filterSelectedValue}>
                    {hasSelection ? selectedLabel : label}
                </span>

                <span className={styles.filterCaret}>▾</span>
            </button>

            {open && (
                <div className={styles.filterMenu} role="listbox" aria-label={label || "Select"}>
                    {/* Search row */}
                    <div className={styles.searchRow}>
                        <FiSearch size={16} className={styles.searchIcon} aria-hidden="true" />
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
                    {visibleOptions.length === 0 && !showCreateNewOption ? (
                        <div className={styles.emptyRow}>{emptyLabel}</div>
                    ) : (
                        <>
                            {visibleOptions.map((opt) => {
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

                            {showCreateNewOption && (
                                <button
                                    type="button"
                                    className={`${styles.filterMenuItem} ${styles.createNewItem}`}
                                    onClick={handleCreateNew}
                                    role="option"
                                    aria-selected={false}
                                >
                                    <FiPlus size={14} className={styles.createNewIcon} />
                                    {createNewLabel}: "{searchTerm.trim()}"
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

FilterDropdownSearchAndAdd.propTypes = {
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
    onCreateNew: PropTypes.func,
    createNewLabel: PropTypes.string,
    allowCreateNew: PropTypes.bool,
};

FilterDropdownSearchAndAdd.defaultProps = {
    className: "",
    emptyLabel: "No results found",
    onCreateNew: null,
    createNewLabel: "Create new",
    allowCreateNew: true,
};

export default FilterDropdownSearchAndAdd;