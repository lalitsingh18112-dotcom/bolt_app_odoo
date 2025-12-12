import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getProfitAndLoss, PnLData } from '../utils/odooApi';

interface ProfitAndLossProps {
  setCurrentPage: (page: string) => void;
}

export const ProfitAndLoss = ({ setCurrentPage }: ProfitAndLossProps) => {
  const { uid, password } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PnLData | null>(null);

  const years = Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i);

  const handleGenerate = async () => {
    if (!uid || !password) return;

    setLoading(true);
    try {
      const result = await getProfitAndLoss(year, uid, password);
      setData(result);
    } catch (error) {
      console.error('Error fetching P&L data:', error);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profit & Loss Report</h1>
          <p className="text-gray-600">View income, expenses, and profitability</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {loading && <LoadingSpinner />}

        {data && !loading && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard label="Total Income" value={data.total_income} color="text-green-600" />
              <MetricCard label="Cost of Goods Sold" value={data.total_cogs} color="text-orange-600" />
              <MetricCard label="Gross Profit" value={data.gross_profit} color="text-blue-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard label="Total Expenses" value={data.total_expense} color="text-red-600" />
              <MetricCard label="Operating Income" value={data.operating_income} color="text-purple-600" />
              <MetricCard
                label="Net Income"
                value={data.net_income}
                color={data.net_income >= 0 ? 'text-green-600' : 'text-red-600'}
              />
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary for {year}</h3>
              <div className="space-y-2 text-gray-700">
                <p>The company generated <span className="font-semibold text-green-600">₹ {data.total_income.toLocaleString('en-IN')}</span> in total revenue.</p>
                <p>After deducting COGS and expenses, the operating income is <span className="font-semibold">₹ {data.operating_income.toLocaleString('en-IN')}</span>.</p>
                <p className={data.net_income >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  Final net income: ₹ {data.net_income.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
