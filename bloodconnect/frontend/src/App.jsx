import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Search from './pages/Search';
import DonorDashboard from './pages/DonorDashboard';
import RequesterDashboard from './pages/RequesterDashboard';
import CreateSOS from './pages/CreateSOS';
import AdminDashboard from './pages/AdminDashboard';
import BloodBankSignup from './pages/BloodBankSignup';
import BloodBankLogin from './pages/BloodBankLogin';
import BloodBankDashboard from './pages/BloodBankDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="flex flex-col min-h-screen bg-gray-50/40 font-sans">
            {/* Global Navbar */}
            <Navbar />

            {/* Main Content Layout */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/search" element={<Search />} />
                <Route path="/bloodbank/signup" element={<BloodBankSignup />} />
                <Route path="/bloodbank/login" element={<BloodBankLogin />} />

                {/* Protected Blood Bank Routes */}
                <Route
                  path="/bloodbank/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['bloodbank']}>
                      <BloodBankDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Donor Routes */}
                <Route
                  path="/donor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['donor']}>
                      <DonorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Requester Routes */}
                <Route
                  path="/requester/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['requester']}>
                      <RequesterDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sos/new"
                  element={
                    <ProtectedRoute allowedRoles={['requester']}>
                      <CreateSOS />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback Redirection */}
                <Route path="*" element={<Landing />} />
              </Routes>
            </main>

            {/* Custom Toast Config */}
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'font-sans text-xs font-bold border border-gray-100 shadow-xl rounded-2xl',
                success: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
