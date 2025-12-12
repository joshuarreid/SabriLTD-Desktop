import React from 'react';
import NavigationBar from '../features/navigationbar/components/NavigationBar';

/**
 * ProtectedLayout
 * - Layout for authenticated content, includes NavigationBar at the top.
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.children - Children elements (protected routes/components)
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[ProtectedLayout]', ...args),
    error: (...args) => console.error('[ProtectedLayout]', ...args),
};

const ProtectedLayout = ({ children }) => {
    logger.info('ProtectedLayout rendered');
    return (
        <div className="protected-area">
            <NavigationBar />
            <main>
                {children}
            </main>
        </div>
    );
};

export default ProtectedLayout;