import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { queryClient } from "./config/queryClient";
import LoginScreen from './screens/loginScreen.jsx';
import { AuthProvider, useAuth } from './features/login/hooks/useAuth';
import ProtectedLayout from './layouts/ProtectedLayout';
import UserProfileScreen from './screens/UserProfileScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import JobScreen from "./screens/JobScreen";
import InventoryDashboardScreen from './screens/InventoryDashboardScreen.jsx';
import AddItemScreen from "./screens/AddItemScreen";

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
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            <Route path="/login" element={<LoginScreen />} />
                            <Route element={<ProtectedRoute />}>
                                <Route
                                    path="/"
                                    element={
                                        <ProtectedLayout>
                                            <InventoryDashboardScreen />
                                            {/* more protected routes/components */}
                                        </ProtectedLayout>
                                    }
                                />
                                {/* The profile route wrapped in ProtectedLayout to keep nav bar */}
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedLayout>
                                            <UserProfileScreen />
                                        </ProtectedLayout>
                                    }
                                />
                                {/* Settings route wrapped in ProtectedLayout */}
                                <Route
                                    path="/settings"
                                    element={
                                        <ProtectedLayout>
                                            <SettingsScreen />
                                        </ProtectedLayout>
                                    }
                                />
                                {/* Add more protected routes as needed */}
                                <Route
                                    path="/jobs"
                                    element={
                                        <ProtectedLayout>
                                            <JobScreen />
                                        </ProtectedLayout>
                                    }
                                />
                                {/* Settings route wrapped in ProtectedLayout */}
                                <Route
                                    path="/add-item"
                                    element={
                                        <ProtectedLayout>
                                            <AddItemScreen />
                                        </ProtectedLayout>
                                    }
                                />
                            </Route>
                        </Routes>
                    </div>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;