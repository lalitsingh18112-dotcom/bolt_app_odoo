import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { DollarSign, FileText, ShoppingCart, TrendingUp, LogOut } from 'lucide-react';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

export const Dashboard = ({ setCurrentPage }: DashboardProps) => {
  const { username, logout } = useAuth();

  const navCards = [
    {
      title: 'Profit & Loss Report',
      icon: DollarSign,
      description: 'View income, expenses, and net profit',
      color: 'from-green-500 to-emerald-600',
      page: 'pnl',
    },
    {
      title: 'Balance Sheet',
      icon: FileText,
      description: 'View assets, liabilities, and equity',
      color: 'from-blue-500 to-cyan-600',
      page: 'balance-sheet',
    },
    {
      title: 'Sales Reports',
      icon: ShoppingCart,
      description: 'Analyze sales orders and revenue',
      color: 'from-purple-500 to-pink-600',
      page: 'sales',
    },
    {
      title: 'CRM Reports',
      icon: TrendingUp,
      description: 'Track leads and opportunities',
      color: 'from-orange-500 to-red-600',
      page: 'crm',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {username}</p>
          </div>
          <Button onClick={logout} variant="secondary">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Logout
            </div>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navCards.map((card, index) => (
            <div
              key={card.page}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setCurrentPage(card.page)}
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-gray-100 transition-all duration-300">
                <div className={`inline-block p-4 bg-gradient-to-r ${card.color} rounded-xl mb-4 transform transition-transform group-hover:rotate-6`}>
                  <card.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
                <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:gap-3 gap-2 transition-all">
                  View Report
                  <span className="transform transition-transform group-hover:translate-x-2">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
