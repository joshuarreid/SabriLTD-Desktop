import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import PingButton from './components/PingButton';
import './App.css';
import { queryClient } from "./config/queryClient";
import LoginScreen from './screens/loginScreen.jsx';
import { AuthProvider, useAuth } from './features/login/useAuth';

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

function App() {
    return (
        <AuthProvider>
            <Router>
                <QueryClientProvider client={queryClient}>
                    <div className="App">
                        <header className="App-header">
                            <h1>Electron + CRA Template</h1>
                            <p>Use the Ping button below to verify preload -&gt; main IPC.</p>
                        </header>
                        <Routes>
                            <Route path="/login" element={<LoginScreen />} />
                            <Route element={<ProtectedRoute />}>
                                {/* Protected routes go here */}
                                <Route
                                    path="/"
                                    element={
                                        <div>
                                            <PingButton />
                                            {/* more protected routes/components */}
                                        </div>
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