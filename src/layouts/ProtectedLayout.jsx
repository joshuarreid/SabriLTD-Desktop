import React from "react";
import NavigationBar from "../components/navigationbar/components/NavigationBar.jsx";
import RouteBar from "../components/navigationbar/components/RouteBar.jsx";


/**
 * logger for ProtectedLayout component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger = {
    info: (...args) => console.log("[ProtectedLayout]", ...args),
    error: (...args) => console.error("[ProtectedLayout]", ...args),
};

/**
 * ProtectedLayout
 * - Layout for authenticated content.
 * - Renders NavigationBar at the top, RouteBar just below it,
 *   and then the routed page content.
 *
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.children - Protected route content.
 * @returns {JSX.Element}
 */
const ProtectedLayout = ({ children }) => {
    logger.info("ProtectedLayout rendered");
    return (
        <div className="protected-area">
            <NavigationBar />
            <RouteBar />
            <main>{children}</main>
        </div>
    );
};

export default ProtectedLayout;