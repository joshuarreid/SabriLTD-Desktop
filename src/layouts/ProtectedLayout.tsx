import React, { ReactNode } from "react";
import NavigationBar from "../components/navigationbar/components/NavigationBar";
import RouteBar from "../components/navigationbar/components/RouteBar";


/**
 * logger for ProtectedLayout component.
 *
 * @constant
 * @type {{info: Function, error: Function}}
 */
const logger: { info: (...args: any[]) => void; error: (...args: any[]) => void } = {
    info: (...args: any[]) => console.log("[ProtectedLayout]", ...args),
    error: (...args: any[]) => console.error("[ProtectedLayout]", ...args),
};

/**
 * Props for ProtectedLayout.
 */
interface ProtectedLayoutProps {
    children: ReactNode;
}

/**
 * ProtectedLayout
 * - Layout for authenticated content.
 * - Renders NavigationBar at the top, RouteBar just below it,
 *   and then the routed page content.
 *
 * @component
 * @param {ProtectedLayoutProps} props
 * @returns {JSX.Element}
 */
const ProtectedLayout = ({ children }: ProtectedLayoutProps): JSX.Element => {
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