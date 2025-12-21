import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai";
import styles from "../styles/routebar.module.css";

/**
 * logger for RouteBar component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[RouteBar]", ...args),
    error: (...args) => console.error("[RouteBar]", ...args),
};

/**
 * humanizeSegment
 * Converts a raw path segment (e.g. "storage-locations") into a human‑readable label.
 *
 * @function humanizeSegment
 * @param {string} segment - Raw path segment from URL.
 * @returns {string} Human‑readable label.
 */
const humanizeSegment = (segment) => {
    if (!segment) return "";
    return segment
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

/**
 * buildBreadcrumbs
 * Builds breadcrumb objects from the current pathname.
 *
 * @function buildBreadcrumbs
 * @param {string} pathname - Current location pathname (e.g. "/settings/jobs").
 * @returns {Array<{label:string,path:string,isCurrent:boolean}>} Breadcrumb entries.
 */
const buildBreadcrumbs = (pathname) => {
    const parts = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Home always first
    breadcrumbs.push({
        label: "Home",
        path: "/",
        isCurrent: parts.length === 0,
    });

    if (parts.length === 0) return breadcrumbs;

    let accumulatedPath = "";
    parts.forEach((part, index) => {
        accumulatedPath += `/${part}`;
        breadcrumbs.push({
            label: humanizeSegment(part),
            path: accumulatedPath,
            isCurrent: index === parts.length - 1,
        });
    });

    return breadcrumbs;
};

/**
 * RouteBar
 *
 * Sabri-themed breadcrumb that sits inside the NavigationBar on the left.
 * Shows the current route as text-only breadcrumbs (e.g., Home › Settings › Jobs).
 *
 * @component
 * @returns {JSX.Element}
 */
const RouteBar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const breadcrumbs = buildBreadcrumbs(location.pathname);
    const currentCrumb = breadcrumbs[breadcrumbs.length - 1];

    logger.info("RouteBar rendered", {
        pathname: location.pathname,
        currentLabel: currentCrumb?.label,
    });

    /**
     * Navigate directly to a breadcrumb's path.
     *
     * @function handleCrumbClick
     * @param {string} path
     * @returns {void}
     */
    const handleCrumbClick = (path) => {
        logger.info("RouteBar breadcrumb clicked", { path });
        navigate(path);
    };

    return (
        <div className={styles.routeBarShell}>
            <nav className={styles.routeBar} aria-label="Breadcrumb">
                <ol className={styles.breadcrumbList}>
                    {breadcrumbs.map((crumb, index) => {
                        const isHome = index === 0;
                        const isCurrent = crumb.isCurrent;

                        return (
                            <li key={crumb.path} className={styles.breadcrumbItem}>
                                {index > 0 && (
                                    <span className={styles.separator}>›</span>
                                )}

                                {isCurrent ? (
                                    <span
                                        className={`${styles.crumbLabel} ${styles.crumbCurrent}`}
                                        aria-current="page"
                                    >
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className={`${styles.crumbLabel} ${styles.crumbLink}`}
                                        onClick={() => handleCrumbClick(crumb.path)}
                                    >
                                        {isHome ? (
                                            <AiOutlineHome
                                                size={15}
                                                className={styles.homeIcon}
                                            />
                                        ) : (
                                            crumb.label
                                        )}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
};

export default RouteBar;