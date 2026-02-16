import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/context/AuthContext';
import { ThemeProvider } from './modules/context/ThemeContext';
import LayoutComponent from './modules/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import './App.css';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><LayoutComponent /></ProtectedRoute>}>
                            <Route index element={<Dashboard />} />
                        </Route>
                        
                        <Route path="/workspaces" element={<ProtectedRoute><LayoutComponent /></ProtectedRoute>}>
                            <Route index element={<Workspaces />} />
                            <Route path=":workspaceId" element={<Projects />} />
                        </Route>

                        <Route path="/projects" element={<ProtectedRoute><LayoutComponent /></ProtectedRoute>}>
                            <Route path=":projectId" element={<Tasks />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;