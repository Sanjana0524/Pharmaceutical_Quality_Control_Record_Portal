import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FlaskConical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, testsRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/tests`)
      ]);
      
      setAnalytics(analyticsRes.data);
      setRecentTests(testsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
          <p className="mt-3 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-600" />
          Quality Control Dashboard
        </h1>
        <p className="text-slate-600">Real-time overview of your QC testing operations</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300" data-testid="total-tests-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Tests</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{analytics?.total_tests || 0}</p>
              </div>
              <div className="p-4 bg-cyan-100 rounded-full">
                <FlaskConical className="w-8 h-8 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300" data-testid="pass-tests-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Passed Tests</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{analytics?.pass_tests || 0}</p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300" data-testid="fail-tests-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Failed Tests</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{analytics?.fail_tests || 0}</p>
              </div>
              <div className="p-4 bg-red-100 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300" data-testid="pass-rate-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pass Rate</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{analytics?.pass_rate || 0}%</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-full">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Types Distribution */}
        <Card className="border-0 shadow-lg" data-testid="test-types-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
              Test Types Distribution
            </CardTitle>
            <CardDescription>Breakdown of tests by type</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.test_types_distribution && Object.keys(analytics.test_types_distribution).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(analytics.test_types_distribution).map(([type, count], index) => {
                  const percentage = (count / analytics.total_tests * 100).toFixed(1);
                  const colors = ['bg-cyan-600', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-orange-600'];
                  const bgColors = ['bg-cyan-100', 'bg-blue-100', 'bg-emerald-100', 'bg-purple-100', 'bg-orange-100'];
                  
                  return (
                    <div key={type}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">{type}</span>
                        <span className="text-sm text-slate-600">{count} ({percentage}%)</span>
                      </div>
                      <div className={`h-3 ${bgColors[index % colors.length]} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No test data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card className="border-0 shadow-lg" data-testid="recent-tests-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5 text-cyan-600" />
              Recent Tests
            </CardTitle>
            <CardDescription>Latest test records submitted</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTests.length > 0 ? (
              <div className="space-y-3">
                {recentTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">{test.product_name}</p>
                        <p className="text-xs text-slate-600">Batch: {test.batch_number}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          test.pass_fail_status === 'Pass'
                            ? 'bg-emerald-100 text-emerald-700'
                            : test.pass_fail_status === 'Fail'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {test.pass_fail_status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{test.test_type}</span>
                      <span>{new Date(test.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No recent tests</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Statistics */}
      {analytics?.product_statistics && Object.keys(analytics.product_statistics).length > 0 && (
        <Card className="border-0 shadow-lg" data-testid="product-stats-card">
          <CardHeader>
            <CardTitle className="text-slate-800">Product Quality Statistics</CardTitle>
            <CardDescription>Performance metrics by product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Total Tests</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Passed</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Failed</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.product_statistics).map(([product, stats]) => {
                    const passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={product} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800">{product}</td>
                        <td className="py-3 px-4 text-center text-slate-700">{stats.total}</td>
                        <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{stats.pass}</td>
                        <td className="py-3 px-4 text-center text-red-600 font-semibold">{stats.fail}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            passRate >= 95 ? 'bg-emerald-100 text-emerald-700' :
                            passRate >= 85 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {passRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
