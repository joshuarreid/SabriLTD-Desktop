import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import styles from "../styles/settingsdropdown.module.css";
import { IoPersonOutline } from "react-icons/io5";
import { MdWarehouse } from "react-icons/md";
import { IoPricetagsOutline } from "react-icons/io5";

/**
 * logger for SettingsDropdown component.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log('[SettingsDropdown]', ...args),
    error: (...args) => console.error('[SettingsDropdown]', ...args),
};

/**
 * Settings options for the dropdown.
 * @constant
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
        route: "/settings?tab=tags",
        icon: <IoPricetagsOutline />,
    }
];

/**
 * SettingsDropdown
 * Dropdown select for settings categories.
 *
 * Shows selected state matching nav styling when user is on a settings screen.
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
     * Handles dropdown toggle.
     * @function
     * @returns {void}
     */
    const handleToggle = () => {
        setOpen((prev) => !prev);
        logger.info("Settings dropdown toggled", { open: !open });
    };

    /**
     * Handles selecting a settings option.
     * @function
     * @param {string} route - The route to navigate to.
     * @returns {void}
     */
    const handleSelect = (route) => {
        setOpen(false);
        navigate(route);
        logger.info("Navigated to settings route", { route });
    };

    /**
     * Closes the dropdown if clicking outside.
     */
    React.useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event) => {
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setOpen(false);
                logger.info("Settings dropdown closed (click outside)");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    /**
     * Returns the active tab key from the search params, or "users" by default.
     * @returns {string}
     */
    const getActiveTab = () => {
        const match = location.search.match(/[?&]tab=(\w+)/);
        if (match) return match[1];
        return "users";
    };

    // Show settings as "active" if on any settings route
    const isSettingsRoute = location.pathname.startsWith("/settings");
    const activeTab = isSettingsRoute ? getActiveTab() : null;

    return (
        <div className={styles.settingsDropdown} tabIndex={0} ref={buttonRef}>
            <button
                type="button"
                className={`${styles.settingsButton} ${open || isSettingsRoute ? styles.settingsButtonActive : ""}`}
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
                        transform: open ? "rotate(-180deg)" : undefined
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
                <div className={styles.settingsDropdownMenu} role="listbox">
                    {SETTINGS_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            className={`${styles.menuButton}${activeTab === opt.key ? " " + styles.menuButtonActive : ""}`}
                            onClick={() => handleSelect(opt.route)}
                            aria-selected={activeTab === opt.key}
                            tabIndex={0}
                        >
                            <span className={styles.menuIconWrap}>{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SettingsDropdown;