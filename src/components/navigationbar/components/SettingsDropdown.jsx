/**
 * SettingsDropdown.jsx
 *
 * Adds "Companies" to the navbar settings dropdown and keeps the same UX as other item:
 *  - Shows active state when the current route is a settings route.
 *  - Navigates to /settings?tab=companies when selected.
 *
 * Conforms to Bulletproof React conventions: UI-only component, side-effects limited to local UI (click outside handler).
 */

import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import styles from '../styles/settingsdropdown.module.css';
import { IoPersonOutline } from "react-icons/io5";
import { MdWarehouse } from "react-icons/md";
import { IoPricetagsOutline } from "react-icons/io5";
import { IoIosCheckmark } from "react-icons/io";

/**
 * Standardized logger for SettingsDropdown.
 * @constant
 */
const logger = {
    info: (...args) => console.log("[SettingsDropdown]", ...args),
    error: (...args) => console.error("[SettingsDropdown]", ...args),
};

/**
 * SETTINGS_OPTIONS
 * Options rendered inside the settings dropdown menu.
 *
 * @type {Array<{label: string, key: string, route: string, icon: JSX.Element}>}
 */
const SETTINGS_OPTIONS = [
    {
        label: "Users",
        key: "users",
        route: "/settings?tab=users",
        icon: <IoPersonOutline />,
    },
    {
        label: "Storage Locations",
        key: "storage",
        route: "/settings?tab=storage",
        icon: <MdWarehouse />,
    },
    {
        label: "Tags",
        key: "tags",
        route: "/settings?tab=tags", // <-- Fixed to plural
        icon: <IoPricetagsOutline />,
    },
    {
        label: "Companies",
        key: "companies",
        route: "/settings?tab=companies",
        icon: <FaBuilding />,
    }
];

/**
 * SettingsDropdown
 *
 * Dropdown select for settings categories. Clicking an item navigates to the
 * appropriate settings tab (e.g. /settings?tab=companies).
 *
 * @component
 * @returns {JSX.Element}
 */
const SettingsDropdown = () => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    /**
     * handleToggle
     * Toggle dropdown open/close.
     *
     * @returns {void}
     */
    const handleToggle = () => {
        setOpen((prev) => !prev);
        logger.info("Settings dropdown toggled", { open: !open });
    };

    /**
     * handleSelect
     * Navigate to the selected settings route and close the menu.
     *
     * @param {string} route - The route to navigate to (e.g. '/settings?tab=companies').
     * @returns {void}
     */
    const handleSelect = (route) => {
        setOpen(false);
        navigate(route);
        logger.info("Navigated to settings route", { route });
    };

    /**
     * getActiveTab
     * Parses the current location search params and returns the active tab key.
     *
     * @returns {string|null} active tab key (e.g. 'companies') or "users" by default when on /settings
     */
    const getActiveTab = () => {
        const match = location.search.match(/[?&]tab=(\w+)/);
        if (match) return match[1];
        return "users";
    };

    // Show settings as "active" if on any settings route
    const isSettingsRoute = location.pathname.startsWith("/settings");
    const activeTab = isSettingsRoute ? getActiveTab() : null;

    /**
     * Close on outside click — attaches listener only while open.
     */
    React.useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target)) {
                setOpen(false);
                logger.info("Settings dropdown closed (click outside)");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className={styles.settingsDropdown} tabIndex={0} ref={buttonRef}>
            <button
                type="button"
                className={`${styles.settingsButton} ${
                    open || isSettingsRoute ? styles.settingsButtonActive : ""
                }`}
                onClick={handleToggle}
                aria-haspopup="listbox"
                aria-expanded={open}
                data-selected={isSettingsRoute ? "true" : undefined}
            >
                <FiSettings size={23} className={styles.settingsIcon} />
                <span className={styles.settingsText}>Settings</span>
                <svg
                    className={styles.caretSvg}
                    width="18"
                    height="18"
                    style={{
                        transition: "transform 0.18s",
                        transform: open ? "rotate(-180deg)" : undefined,
                    }}
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                >
                    <path
                        d="M6 8L10 12L14 8"
                        stroke="#b3abc8"
                        strokeWidth="1.44"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {open && (
                <div className={styles.settingsDropdownMenu} role="listbox" aria-label="Settings options">
                    {SETTINGS_OPTIONS.map((opt) => {
                        const isActive = activeTab === opt.key;
                        return (
                            <button
                                key={opt.key}
                                className={`${styles.menuButton}${isActive ? " " + styles.menuButtonActive : ""}`}
                                onClick={() => handleSelect(opt.route)}
                                aria-selected={isActive}
                                tabIndex={0}
                                type="button"
                            >
                                <span className={styles.menuIconWrap} aria-hidden>
                                    {opt.icon}
                                </span>

                                {/* Wrapped label so CSS can target the label specifically */}
                                <span className={styles.menuLabel}>{opt.label}</span>

                                {/* Checkmark indicator aligned to the right when selected */}
                                <span className={styles.menuCheckWrap} aria-hidden>
                                    {isActive ? <IoIosCheckmark /> : null}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SettingsDropdown;