import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/auth/LoginScreen';
import Layout from './components/layout/Layout';

const AppContent: React.FC = () => {
  const { isAuthenticated, login, logout, isLoading } = useApp();

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
                <span className="text-5xl animate-bounce">📦</span>
                <p className="text-gray-600 mt-4">Cargando datos...</p>
            </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return <Layout onLogout={logout} />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;