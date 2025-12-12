import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getBalanceSheet, BalanceSheetData } from '../utils/odooApi';

interface BalanceSheetProps {
  setCurrentPage: (page: string) => void;
}

export const BalanceSheet = ({ setCurrentPage }: BalanceSheetProps) => {
  const { uid, password } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BalanceSheetData | null>(null);

  const handleGenerate = async () => {
    if (!uid || !password) return;

    setLoading(true);
    try {
      const result = await getBalanceSheet(selectedDate, uid, password);
      setData(result);
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <Button onClick={() => setCurrentPage('dashboard')} variant="secondary" className="mb-4">
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </div>
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Balance Sheet</h1>
          <p className="text-gray-600">View assets, liabilities, and equity</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Balance Sheet'}
            </Button>
          </div>
        </div>

        {loading && <LoadingSpinner />}

        {data && !loading && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard label="Total Assets" value={data.total_assets} color="text-blue-600" />
              <MetricCard label="Total Liabilities" value={data.total_liabilities} color="text-red-600" />
              <MetricCard label="Total Equity" value={data.total_equity} color="text-orange-600" />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <MetricCard
                label="Balance Difference"
                value={data.balance_difference}
                color={Math.abs(data.balance_difference) < 0.01 ? 'text-green-600' : 'text-yellow-600'}
              />
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance Sheet Summary</h3>
              <div className="space-y-2 text-gray-700">
                <p>As of <span className="font-semibold">{new Date(selectedDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                <p>Total Assets: <span className="font-semibold text-blue-600">₹ {data.total_assets.toLocaleString('en-IN')}</span></p>
                <p>Total Liabilities + Equity: <span className="font-semibold">₹ {(data.total_liabilities + data.total_equity).toLocaleString('en-IN')}</span></p>
                {Math.abs(data.balance_difference) < 0.01 ? (
                  <p className="text-green-600 font-semibold">✓ Balance sheet is balanced</p>
                ) : (
                  <p className="text-yellow-600 font-semibold">⚠ Balance difference: ₹ {data.balance_difference.toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
