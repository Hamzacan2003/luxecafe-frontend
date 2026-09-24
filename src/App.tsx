import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { QrMenu } from './pages/QrMenu';
import { AdminDashboard } from './pages/AdminDashboard';
import { PosDashboard } from './pages/PosDashboard';
import { ProfileSettings } from './pages/ProfileSettings';

const ManagerRoute = ({ children }: { children: ReactNode }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" replace />;
    if (role !== 'Manager') return <Navigate to="/pos" replace />;

    return <>{children}</>;
};

const AuthRoute = ({ children }: { children: ReactNode }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/menu/:qrToken" element={<QrMenu />} />

                <Route
                    path="/admin"
                    element={
                        <ManagerRoute>
                            <AdminDashboard />
                        </ManagerRoute>
                    }
                />

                <Route
                    path="/pos"
                    element={
                        <AuthRoute>
                            <PosDashboard />
                        </AuthRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <AuthRoute>
                            <ProfileSettings />
                        </AuthRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/pos" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;