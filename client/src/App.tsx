import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Payables from './pages/Payables';
import Receivables from './pages/Receivables';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Collaborators from './pages/Collaborators';
import HealthPlans from './pages/HealthPlans';
import DentalPlans from './pages/DentalPlans';
import Enrollments from './pages/Enrollments';
import EnrollmentReports from './pages/EnrollmentReports';
import BankAccounts from './pages/BankAccounts';
import CompanyProfile from './pages/CompanyProfile';
import Contracts from './pages/Contracts';
import Customers from './pages/Customers';
import Reconciliation from './pages/Reconciliation';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

function App() {
    return (
        <Router>
            <ThemeProvider defaultTheme="dark" storageKey="wayfin-ui-theme">
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<DashboardLayout />}>
                                <Route index element={<Dashboard />} />
                                <Route path="payables" element={<Payables />} />
                                <Route path="receivables" element={<Receivables />} />
                                <Route path="collaborators" element={<Collaborators />} />
                                <Route path="health-plans" element={<HealthPlans />} />
                                <Route path="dental-plans" element={<DentalPlans />} />
                                <Route path="enrollments" element={<Enrollments />} />
                                <Route path="reports" element={<Reports />} />
                                <Route path="enrollment-reports" element={<EnrollmentReports />} />
                                <Route path="bank-accounts" element={<BankAccounts />} />
                                <Route path="reconciliation" element={<Reconciliation />} />
                                <Route path="contracts" element={<Contracts />} />
                                <Route path="customers" element={<Customers />} />
                                <Route path="company" element={<CompanyProfile />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <Toaster position="top-right" richColors />
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;

