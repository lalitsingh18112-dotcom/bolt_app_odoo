import { useState, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { odooRpcCall, fetchSalespersons, fetchSalesTeams } from '../utils/odooApi';

interface CRMReportProps {
  setCurrentPage: (page: string) => void;
}

export const CRMReport = ({ setCurrentPage }: CRMReportProps) => {
  const { uid, password } = useAuth();
  const [year, setYear] = useState<string | number>('All');
  const [month, setMonth] = useState<string | number>('All');
  const [day, setDay] = useState<string | number>('All');
  const [selectedSalesperson, setSelectedSalesperson] = useState('0');
  const [selectedTeam, setSelectedTeam] = useState('0');
  const [loading, setLoading] = useState(false);
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const years = Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    if (uid && password) {
      fetchSalespersons(uid, password).then(setSalespersons);
      fetchSalesTeams(uid, password).then(setTeams);
    }
  }, [uid, password]);

  const handleGenerate = async () => {
    if (!uid || !password) return;

    setLoading(true);
    try {
      const domain: any[] = [];

      if (year !== 'All') {
        const y = parseInt(year as string);
        let startDate, endDate;

        if (month !== 'All') {
          const m = parseInt(month as string);
          if (day !== 'All') {
            const d = parseInt(day as string);
            startDate = endDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} 00:00:00`;
          } else {
            startDate = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
            endDate = `${y}-${String(m).padStart(2, '0')}-31 23:59:59`;
          }
        } else {
          startDate = `${y}-01-01 00:00:00`;
          endDate = `${y}-12-31 23:59:59`;
        }
        domain.push(['create_date', '>=', startDate], ['create_date', '<=', endDate]);
      }

      if (selectedSalesperson !== '0') {
        domain.push(['user_id', '=', parseInt(selectedSalesperson)]);
      }

      if (selectedTeam !== '0') {
        domain.push(['team_id', '=', parseInt(selectedTeam)]);
      }

      const leads = await odooRpcCall({
        uid,
        password,
        model: 'crm.lead',
        method: 'search_read',
        args: [domain.length ? domain : []],
        kwargs: {
          fields: ['name', 'contact_name', 'email_from', 'phone', 'expected_revenue', 'stage_id', 'user_id', 'team_id', 'create_date'],
          limit: 1000,
        },
      });

      setLeadsData(leads || []);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpectedRevenue = leadsData.reduce((sum, lead) => sum + (lead.expected_revenue || 0), 0);

  const downloadCSV = () => {
    const headers = ['Lead Name', 'Contact', 'Email', 'Phone', 'Expected Revenue', 'Stage', 'Salesperson', 'Team', 'Created On'];
    const rows = leadsData.map(l => [
      l.name || 'N/A',
      l.contact_name || 'N/A',
      l.email_from || 'N/A',
      l.phone || 'N/A',
      l.expected_revenue || 0,
      l.stage_id ? l.stage_id[1] : 'N/A',
      l.user_id ? l.user_id[1] : 'N/A',
      l.team_id ? l.team_id[1] : 'N/A',
      l.create_date || 'N/A',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CRM Report</h1>
          <p className="text-gray-600">Track leads and opportunities</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="All">All</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="All">All</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="All">All</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salesperson</label>
              <select
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="0">All</option>
                {salespersons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sales Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="0">All</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Loading...' : 'Show Leads'}
          </Button>
        </div>

        {loading && <LoadingSpinner />}

        {!loading && leadsData.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-lg font-semibold">Total Leads: <span className="text-blue-600">{leadsData.length}</span></p>
                  <p className="text-lg font-semibold">Total Expected Revenue: <span className="text-green-600">₹ {totalExpectedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></p>
                </div>
                <Button onClick={downloadCSV} variant="secondary">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Download CSV
                  </div>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-4 py-3 text-left">Lead Name</th>
                      <th className="px-4 py-3 text-left">Contact</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-right">Expected Revenue</th>
                      <th className="px-4 py-3 text-left">Stage</th>
                      <th className="px-4 py-3 text-left">Salesperson</th>
                      <th className="px-4 py-3 text-left">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData.map((lead, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">{lead.name || 'N/A'}</td>
                        <td className="px-4 py-3">{lead.contact_name || 'N/A'}</td>
                        <td className="px-4 py-3">{lead.email_from || 'N/A'}</td>
                        <td className="px-4 py-3">{lead.phone || 'N/A'}</td>
                        <td className="px-4 py-3 text-right">₹ {(lead.expected_revenue || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">{lead.stage_id ? lead.stage_id[1] : 'N/A'}</td>
                        <td className="px-4 py-3">{lead.user_id ? lead.user_id[1] : 'N/A'}</td>
                        <td className="px-4 py-3">{lead.team_id ? lead.team_id[1] : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && leadsData.length === 0 && year !== 'All' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">No CRM leads found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
