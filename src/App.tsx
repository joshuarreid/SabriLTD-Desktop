import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { queryClient } from "./config/queryClient.js";
import LoginScreen from './pages/components/loginScreen';
import { AuthProvider, useAuth } from './features/auth/hooks/useAuth';
import ProtectedLayout from './layouts/ProtectedLayout.jsx';
import UserProfileScreen from './pages/components/UserProfileScreen.jsx';
import SettingsScreen from './pages/components/SettingsScreen.jsx';
import JobScreen from "./pages/components/JobScreen.jsx";
import HomeScreen from './pages/components/HomeScreen.jsx';
import AddItemScreen from "./pages/components/AddItemScreen.jsx";
import JobDetailScreen from "./pages/components/JobDetailScreen.jsx";

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
type Logger = {
    info: (...args: any[]) => void;
    error: (...args: any[]) => void;
};

const logger: Logger = {
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
                                            <HomeScreen />
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
                                {/* Jobs list route wrapped in ProtectedLayout */}
                                <Route
                                    path="/jobs"
                                    element={
                                        <ProtectedLayout>
                                            <JobScreen />
                                        </ProtectedLayout>
                                    }
                                />
                                {/* Job details route (NEW) wrapped in ProtectedLayout */}
                                <Route
                                    path="/jobs/:jobId"
                                    element={
                                        <ProtectedLayout>
                                            <JobDetailScreen />
                                        </ProtectedLayout>
                                    }
                                />
                                {/* Add item route wrapped in ProtectedLayout */}
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