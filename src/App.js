import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import PingButton from './components/PingButton';
import './App.css';
import { queryClient } from "./config/queryClient";
import LoginScreen from './screens/loginScreen.jsx';
import { AuthProvider, useAuth } from './features/login/hooks/useAuth';
import ProtectedLayout from './layouts/ProtectedLayout';

/**
 * ProtectedRoute
 * - Restricts access to authenticated users only.
 *
 * @returns {JSX.Element}
 */
const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null; // Or spinner, if desired
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * App
 * - Main application entry.
 * @component
 * @returns {JSX.Element}
 */
const logger = {
    info: (...args) => console.log('[App]', ...args),
    error: (...args) => console.error('[App]', ...args),
};

function App() {
    logger.info('App rendered');
    return (
        <AuthProvider>
            <Router>
                <QueryClientProvider client={queryClient}>
                    <div className="App">
                        <Routes>
                            <Route path="/login" element={<LoginScreen />} />
                            <Route element={<ProtectedRoute />}>
                                <Route
                                    path="/"
                                    element={
                                        <ProtectedLayout>
                                            <PingButton />
                                            {/* more protected routes/components */}
                                        </ProtectedLayout>
                                    }
                                />
                                {/* Add more protected routes as needed */}
                            </Route>
                        </Routes>
                    </div>
                </QueryClientProvider>
            </Router>
        </AuthProvider>
    );
}

export default App;