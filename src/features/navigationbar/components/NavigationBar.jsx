import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoIosSearch } from "react-icons/io";
import { IoFolderOpenOutline } from "react-icons/io5";
import Logo from "./Logo";
import UserDropdown from "./UserDropdown";
import SettingsDropdown from "./SettingsDropdown";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import styles from "../styles/navigationbar.module.css";

/**
 * logger for NavigationBar component.
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[NavigationBar]", ...args),
    error: (...args) => console.error("[NavigationBar]", ...args),
};

/**
 * NavIconButton
 * - Icon button for nav bar actions, accessible and styled.
 *
 * @param {object} props
 * @param {JSX.Element} props.icon
 * @param {string} props.label - Accessible label for the icon
 * @param {function} [props.onClick]
 * @param {boolean} [props.selected] - Whether this button is currently selected/active
 * @returns {JSX.Element}
 */
const NavIconButton = ({ icon, label, onClick, selected = false }) => (
    <button
        className={`${styles.iconButton}${selected ? " " + styles.selectedIconButton : ""}`}
        aria-label={label}
        title={label}
        type="button"
        tabIndex={0}
        onClick={onClick}
        data-selected={selected ? "true" : undefined}
    >
        {icon}
    </button>
);

/**
 * NavigationBarIcons
 * - Renders action icons: search, jobs, and the settings dropdown.
 * - Highlights selected/active icon based on current route using useLocation.
 */
const NavigationBarIcons = () => {
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Handles navigation to search and jobs pages.
     * @function
     * @param {string} path - The path to navigate to.
     * @returns {void}
     */
    const handleNavClick = React.useCallback(
        path => {
            logger.info(`${path} icon clicked, navigating to ${path}`);
            navigate(path);
        },
        [navigate],
    );

    // Active route matching (update logic as desired for deeper matching)
    const isSearch = location.pathname.startsWith("/search");
    const isJobs = location.pathname.startsWith("/jobs");

    return (
        <div className={styles.iconGroup}>
            <NavIconButton
                icon={<IoIosSearch size={24} className={styles.iconSvg} />}
                label="Search"
                onClick={() => handleNavClick("/search")}
                selected={isSearch}
            />
            <NavIconButton
                icon={<IoFolderOpenOutline size={24} className={styles.iconSvg} />}
                label="Jobs"
                onClick={() => handleNavClick("/jobs")}
                selected={isJobs}
            />
            <SettingsDropdown />
        </div>
    );
};

/**
 * NavigationBar
 * Main navigation bar for the application, including icons and user dropdown.
 * @component
 * @returns {JSX.Element}
 */
const NavigationBar = () => {
    logger.info("NavigationBar rendered");
    const { user, loading, error } = useCurrentUser();

    logger.info("NavigationBar: useCurrentUser output", { user, loading, error });

    return (
        <nav className={styles.navbar} role="navigation">
            <div className={styles.logoContainer}>
                <Logo />
            </div>
            <div className={styles.rightSection}>
                <NavigationBarIcons />
                <div className={styles.user}>
                    {loading ? (
                        <span style={{ color: "gray" }}>Loading user...</span>
                    ) : error ? (
                        <span style={{ color: "red" }}>User error</span>
                    ) : user ? (
                        <UserDropdown user={user} />
                    ) : (
                        <span style={{ color: "red" }}>NO USER FOUND</span>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;