import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { StockMovements } from './pages/StockMovements';
import { Challans } from './pages/Challans';
import { ChallanForm } from './pages/ChallanForm';
import { ChallanDetails } from './pages/ChallanDetails';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const RoleGuard: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated Dashboard Routes */}
        <Route path="/" element={<DashboardLayout />}>
          {/* Default entrypoint redirects to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Customer CRM */}
          <Route
            path="customers"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <Customers />
              </RoleGuard>
            }
          />
          <Route
            path="customers/:id"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <CustomerDetails />
              </RoleGuard>
            }
          />

          {/* Products catalog */}
          <Route
            path="products"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <Products />
              </RoleGuard>
            }
          />

          {/* Inventory stock adjustments */}
          <Route
            path="inventory"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <Inventory />
              </RoleGuard>
            }
          />
          <Route
            path="stock-movements"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <StockMovements />
              </RoleGuard>
            }
          />

          {/* Sales Challans */}
          <Route
            path="challans"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <Challans />
              </RoleGuard>
            }
          />
          <Route
            path="challans/new"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'SALES']}>
                <ChallanForm />
              </RoleGuard>
            }
          />
          <Route
            path="challans/:id"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <ChallanDetails />
              </RoleGuard>
            }
          />

          {/* User management - Admin only */}
          <Route
            path="users"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <Users />
              </RoleGuard>
            }
          />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <RoleGuard allowedRoles={['ADMIN', 'ACCOUNTS']}>
                <Reports />
              </RoleGuard>
            }
          />

          {/* Settings - Admin only */}
          <Route
            path="settings"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <Settings />
              </RoleGuard>
            }
          />
        </Route>

        {/* Fallback redirects to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
