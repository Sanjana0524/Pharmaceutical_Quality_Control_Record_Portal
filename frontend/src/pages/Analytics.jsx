import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { toast } from 'sonner';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
          <p className="mt-3 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in" data-testid="analytics-page">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-cyan-600" />
          Quality Analytics & Insights
        </h1>
        <p className="text-slate-600">Comprehensive quality metrics and performance trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg" data-testid="total-tests-metric">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Tests Performed</p>
                <p className="text-4xl font-bold text-slate-800 mt-2">{analytics?.total_tests || 0}</p>
                <p className="text-xs text-slate-500 mt-1">All time</p>
              </div>
              <div className="p-4 bg-cyan-100 rounded-full">
                <Activity className="w-8 h-8 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" data-testid="pass-rate-metric">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Overall Pass Rate</p>
                <p className="text-4xl font-bold text-emerald-600 mt-2">{analytics?.pass_rate || 0}%</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Quality target: 95%
                </p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-full">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" data-testid="recent-tests-metric">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Recent Tests (7 days)</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{analytics?.recent_tests_count || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Last week activity</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-full">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" data-testid="fail-tests-metric">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Failed Tests</p>
                <p className="text-4xl font-bold text-red-600 mt-2">{analytics?.fail_tests || 0}</p>
                <p className="text-xs text-red-600 mt-1">Requires attention</p>
              </div>
              <div className="p-4 bg-red-100 rounded-full">
                <PieChart className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pass/Fail Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg" data-testid="pass-fail-chart">
          <CardHeader>
            <CardTitle className="text-slate-800">Pass/Fail Distribution</CardTitle>
            <CardDescription>Overall test result breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-emerald-700">Passed Tests</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {analytics?.pass_tests || 0} ({((analytics?.pass_tests / analytics?.total_tests) * 100 || 0).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-8 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000"
                    style={{ width: `${(analytics?.pass_tests / analytics?.total_tests) * 100 || 0}%` }}
                  />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">Failed Tests</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {analytics?.fail_tests || 0} ({((analytics?.fail_tests / analytics?.total_tests) * 100 || 0).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-8 bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000"
                    style={{ width: `${(analytics?.fail_tests / analytics?.total_tests) * 100 || 0}%` }}
                  />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-700">Pending Review</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {analytics?.pending_tests || 0} ({((analytics?.pending_tests / analytics?.total_tests) * 100 || 0).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-8 bg-yellow-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-1000"
                    style={{ width: `${(analytics?.pending_tests / analytics?.total_tests) * 100 || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{analytics?.pass_tests || 0}</p>
                  <p className="text-xs text-slate-600 mt-1">Pass</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{analytics?.fail_tests || 0}</p>
                  <p className="text-xs text-slate-600 mt-1">Fail</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{analytics?.pending_tests || 0}</p>
                  <p className="text-xs text-slate-600 mt-1">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Types Distribution */}
        <Card className="border-0 shadow-lg" data-testid="test-types-distribution">
          <CardHeader>
            <CardTitle className="text-slate-800">Test Types Distribution</CardTitle>
            <CardDescription>Breakdown by test category</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.test_types_distribution && Object.keys(analytics.test_types_distribution).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(analytics.test_types_distribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count], index) => {
                    const percentage = ((count / analytics.total_tests) * 100).toFixed(1);
                    const colors = [
                      { bg: 'bg-cyan-600', light: 'bg-cyan-100' },
                      { bg: 'bg-blue-600', light: 'bg-blue-100' },
                      { bg: 'bg-emerald-600', light: 'bg-emerald-100' },
                      { bg: 'bg-purple-600', light: 'bg-purple-100' },
                      { bg: 'bg-orange-600', light: 'bg-orange-100' },
                      { bg: 'bg-pink-600', light: 'bg-pink-100' },
                    ];
                    const color = colors[index % colors.length];

                    return (
                      <div key={type}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">{type}</span>
                          <span className="text-sm text-slate-600 font-semibold">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className={`h-3 ${color.light} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full ${color.bg} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <PieChart className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                <p>No test type data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      {analytics?.product_statistics && Object.keys(analytics.product_statistics).length > 0 && (
        <Card className="border-0 shadow-lg" data-testid="product-performance-table">
          <CardHeader>
            <CardTitle className="text-slate-800">Product Performance Analysis</CardTitle>
            <CardDescription>Quality metrics by product line</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Product Name</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Total Tests</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Passed</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Failed</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Pass Rate</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Quality Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.product_statistics)
                    .sort((a, b) => {
                      const rateA = a[1].total > 0 ? (a[1].pass / a[1].total) * 100 : 0;
                      const rateB = b[1].total > 0 ? (b[1].pass / b[1].total) * 100 : 0;
                      return rateB - rateA;
                    })
                    .map(([product, stats]) => {
                      const passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(1) : 0;
                      const status =
                        passRate >= 95
                          ? { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-100' }
                          : passRate >= 85
                          ? { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' }
                          : passRate >= 75
                          ? { label: 'Acceptable', color: 'text-yellow-700', bg: 'bg-yellow-100' }
                          : { label: 'Needs Attention', color: 'text-red-700', bg: 'bg-red-100' };

                      return (
                        <tr key={product} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 font-semibold text-slate-800">{product}</td>
                          <td className="py-4 px-4 text-center text-slate-700 font-medium">{stats.total}</td>
                          <td className="py-4 px-4 text-center text-emerald-600 font-semibold">{stats.pass}</td>
                          <td className="py-4 px-4 text-center text-red-600 font-semibold">{stats.fail}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-lg font-bold text-slate-800">{passRate}%</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${status.bg} ${status.color}`}>
                              {status.label}
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

      {/* Quality Insights */}
      <Card className="border-0 shadow-lg border-l-4 border-l-cyan-600" data-testid="quality-insights">
        <CardHeader>
          <CardTitle className="text-slate-800">Quality Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics && (
              <>
                {analytics.pass_rate >= 95 && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-emerald-800 font-medium">✓ Excellent Quality Performance</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Your overall pass rate of {analytics.pass_rate}% exceeds the industry standard. Keep up the great work!
                    </p>
                  </div>
                )}

                {analytics.pass_rate < 95 && analytics.pass_rate >= 85 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 font-medium">⚠ Good Performance with Room for Improvement</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Current pass rate: {analytics.pass_rate}%. Target is 95%. Consider reviewing processes for failed tests.
                    </p>
                  </div>
                )}

                {analytics.pass_rate < 85 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 font-medium">⚠ Quality Concerns Detected</p>
                    <p className="text-sm text-red-700 mt-1">
                      Pass rate of {analytics.pass_rate}% is below target. Immediate review of testing procedures and product specifications recommended.
                    </p>
                  </div>
                )}

                {analytics.fail_tests > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 font-medium">ℹ Action Items</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {analytics.fail_tests} failed test(s) require investigation and corrective action planning.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
