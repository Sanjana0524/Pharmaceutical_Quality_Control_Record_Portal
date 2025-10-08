import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Eye,
  FileSignature,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const TestRecords = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signData, setSignData] = useState({
    username: '',
    password: '',
    meaning: 'Reviewed by',
    comments: ''
  });

  const [filters, setFilters] = useState({
    batch_number: '',
    product_name: '',
    test_type: '',
    pass_fail_status: '',
    date_from: '',
    date_to: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tests, filters]);

  const fetchTests = async () => {
    try {
      const response = await axios.get(`${API}/tests`);
      setTests(response.data);
      setFilteredTests(response.data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      toast.error('Failed to load test records');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tests];

    if (filters.batch_number) {
      filtered = filtered.filter(test => 
        test.batch_number.toLowerCase().includes(filters.batch_number.toLowerCase())
      );
    }

    if (filters.product_name) {
      filtered = filtered.filter(test => 
        test.product_name.toLowerCase().includes(filters.product_name.toLowerCase())
      );
    }

    if (filters.test_type) {
      filtered = filtered.filter(test => test.test_type === filters.test_type);
    }

    if (filters.pass_fail_status) {
      filtered = filtered.filter(test => test.pass_fail_status === filters.pass_fail_status);
    }

    if (filters.date_from) {
      filtered = filtered.filter(test => test.test_date >= filters.date_from);
    }

    if (filters.date_to) {
      filtered = filtered.filter(test => test.test_date <= filters.date_to);
    }

    setFilteredTests(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      batch_number: '',
      product_name: '',
      test_type: '',
      pass_fail_status: '',
      date_from: '',
      date_to: ''
    });
  };

  const viewTestDetails = (test) => {
    setSelectedTest(test);
    setShowDetailsModal(true);
  };

  const openSignModal = (test) => {
    setSelectedTest(test);
    const user = JSON.parse(localStorage.getItem('user'));
    setSignData(prev => ({ ...prev, username: user?.username || '' }));
    setShowSignModal(true);
  };

  const handleSign = async () => {
    if (!signData.username || !signData.password) {
      toast.error('Please enter username and password');
      return;
    }

    try {
      await axios.post(`${API}/tests/${selectedTest.id}/sign`, signData);
      toast.success('Test record signed successfully!');
      setShowSignModal(false);
      setSignData({ username: '', password: '', meaning: 'Reviewed by', comments: '' });
      fetchTests();
    } catch (error) {
      console.error('Failed to sign test:', error);
      toast.error(error.response?.data?.detail || 'Failed to sign test record');
    }
  };

  const exportToCSV = () => {
    if (filteredTests.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Batch Number',
      'Product Name',
      'Test Type',
      'Test Date',
      'Result Value',
      'Unit',
      'Min Spec',
      'Max Spec',
      'Status',
      'Analyst'
    ];

    const csvData = filteredTests.map(test => [
      test.batch_number,
      test.product_name,
      test.test_type,
      test.test_date,
      test.result_value,
      test.result_unit,
      test.specification_min,
      test.specification_max,
      test.pass_fail_status,
      test.analyst_name
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qc_test_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('CSV exported successfully!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pass':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'Fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
          <p className="mt-3 text-slate-600">Loading test records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="test-records-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-600" />
            Test Records
          </h1>
          <p className="text-slate-600">
            View and manage all quality control test records ({filteredTests.length} records)
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-slate-300"
            data-testid="toggle-filters-button"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            onClick={exportToCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="export-csv-button"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="border-0 shadow-lg" data-testid="filters-card">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-600" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter_batch_number" className="text-slate-700">Batch Number</Label>
                <Input
                  id="filter_batch_number"
                  name="batch_number"
                  placeholder="Search batch number"
                  value={filters.batch_number}
                  onChange={handleFilterChange}
                  className="border-slate-300"
                  data-testid="filter-batch-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter_product_name" className="text-slate-700">Product Name</Label>
                <Input
                  id="filter_product_name"
                  name="product_name"
                  placeholder="Search product name"
                  value={filters.product_name}
                  onChange={handleFilterChange}
                  className="border-slate-300"
                  data-testid="filter-product-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter_test_type" className="text-slate-700">Test Type</Label>
                <select
                  id="filter_test_type"
                  name="test_type"
                  value={filters.test_type}
                  onChange={handleFilterChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  data-testid="filter-test-type-select"
                >
                  <option value="">All Test Types</option>
                  <option value="Assay">Assay</option>
                  <option value="Identity">Identity</option>
                  <option value="Dissolution">Dissolution</option>
                  <option value="Content Uniformity">Content Uniformity</option>
                  <option value="Microbial Limits">Microbial Limits</option>
                  <option value="Heavy Metals">Heavy Metals</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter_status" className="text-slate-700">Status</Label>
                <select
                  id="filter_status"
                  name="pass_fail_status"
                  value={filters.pass_fail_status}
                  onChange={handleFilterChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  data-testid="filter-status-select"
                >
                  <option value="">All Statuses</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter_date_from" className="text-slate-700">Date From</Label>
                <Input
                  id="filter_date_from"
                  name="date_from"
                  type="date"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="border-slate-300"
                  data-testid="filter-date-from-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter_date_to" className="text-slate-700">Date To</Label>
                <Input
                  id="filter_date_to"
                  name="date_to"
                  type="date"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="border-slate-300"
                  data-testid="filter-date-to-input"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-slate-300"
                data-testid="clear-filters-button"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Records Table */}
      <Card className="border-0 shadow-lg" data-testid="test-records-table-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Batch Number</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Product</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Test Type</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Test Date</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700 text-sm">Result</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700 text-sm">Status</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Analyst</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <tr
                      key={test.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">
                        {test.batch_number}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{test.product_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{test.test_type}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{test.test_date}</td>
                      <td className="py-3 px-4 text-sm text-center text-slate-700">
                        {test.result_value} {test.result_unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(test.pass_fail_status)}
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
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{test.analyst_name}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewTestDetails(test)}
                            className="border-slate-300"
                            data-testid={`view-test-${test.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSignModal(test)}
                            className="border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                            data-testid={`sign-test-${test.id}`}
                          >
                            <FileSignature className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      No test records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Test Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Test Record Details</DialogTitle>
            <DialogDescription>Complete information for test record</DialogDescription>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Batch Number</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTest.batch_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Product Name</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTest.product_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Test Type</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTest.test_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Test Method</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTest.test_method || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Equipment Used</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedTest.equipment_used || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Test Date & Time</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedTest.test_date} {selectedTest.test_time}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-slate-800 mb-3">Test Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Result Value</p>
                    <p className="text-lg font-bold text-slate-800">
                      {selectedTest.result_value} {selectedTest.result_unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Specification Range</p>
                    <p className="text-lg font-bold text-slate-800">
                      {selectedTest.specification_min} - {selectedTest.specification_max} {selectedTest.result_unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Status</p>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                        selectedTest.pass_fail_status === 'Pass'
                          ? 'bg-emerald-100 text-emerald-700'
                          : selectedTest.pass_fail_status === 'Fail'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {getStatusIcon(selectedTest.pass_fail_status)}
                      {selectedTest.pass_fail_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-1">Analyst</p>
                  <p className="text-sm text-slate-800">{selectedTest.analyst_name}</p>
                </div>
                {selectedTest.comments && (
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Comments</p>
                    <p className="text-sm text-slate-800 p-3 bg-slate-50 rounded">{selectedTest.comments}</p>
                  </div>
                )}
                {selectedTest.deviation_notes && (
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Deviation Notes</p>
                    <p className="text-sm text-slate-800 p-3 bg-red-50 rounded border border-red-200">
                      {selectedTest.deviation_notes}
                    </p>
                  </div>
                )}
                {selectedTest.signature && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-slate-600 font-medium mb-1">Electronic Signature</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedTest.signature}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Signed on: {new Date(selectedTest.signature_date).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Electronic Signature Modal */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Electronic Signature</DialogTitle>
            <DialogDescription>
              Sign this test record electronically to approve and lock the data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sign_username" className="text-slate-700 font-medium">Username</Label>
              <Input
                id="sign_username"
                value={signData.username}
                onChange={(e) => setSignData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                className="border-slate-300"
                data-testid="sign-username-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign_password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="sign_password"
                type="password"
                value={signData.password}
                onChange={(e) => setSignData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                className="border-slate-300"
                data-testid="sign-password-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign_meaning" className="text-slate-700 font-medium">Signature Meaning</Label>
              <select
                id="sign_meaning"
                value={signData.meaning}
                onChange={(e) => setSignData(prev => ({ ...prev, meaning: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                data-testid="sign-meaning-select"
              >
                <option value="Tested by">Tested by</option>
                <option value="Reviewed by">Reviewed by</option>
                <option value="Approved by">Approved by</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign_comments" className="text-slate-700 font-medium">Comments (Optional)</Label>
              <Input
                id="sign_comments"
                value={signData.comments}
                onChange={(e) => setSignData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Add signature comments"
                className="border-slate-300"
                data-testid="sign-comments-input"
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> By signing this document electronically, you are legally 
                confirming the accuracy of the test data and your identity.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSignModal(false)}
                className="border-slate-300"
                data-testid="cancel-sign-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                data-testid="confirm-sign-button"
              >
                <FileSignature className="w-4 h-4 mr-2" />
                Sign Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestRecords;
