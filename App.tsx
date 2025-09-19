import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/auth/LoginScreen';
import Layout from './components/layout/Layout';

const AppContent: React.FC = () => {
  const { isAuthenticated, login, logout } = useApp();

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
