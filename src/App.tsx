import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProfitAndLoss } from './pages/ProfitAndLoss';
import { BalanceSheet } from './pages/BalanceSheet';
import { SalesReport } from './pages/SalesReport';
import { CRMReport } from './pages/CRMReport';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      {currentPage === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} />}
      {currentPage === 'pnl' && <ProfitAndLoss setCurrentPage={setCurrentPage} />}
      {currentPage === 'balance-sheet' && <BalanceSheet setCurrentPage={setCurrentPage} />}
      {currentPage === 'sales' && <SalesReport setCurrentPage={setCurrentPage} />}
      {currentPage === 'crm' && <CRMReport setCurrentPage={setCurrentPage} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
