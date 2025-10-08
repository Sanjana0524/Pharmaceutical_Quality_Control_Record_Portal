import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSearch, Filter, User, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const AuditTrail = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    entity_type: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters]);

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get(`${API}/audit-logs`);
      setAuditLogs(response.data);
      setFilteredLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view audit logs');
      } else {
        toast.error('Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    if (filters.username) {
      filtered = filtered.filter(log =>
        log.username.toLowerCase().includes(filters.username.toLowerCase())
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.entity_type) {
      filtered = filtered.filter(log => log.entity_type === filters.entity_type);
    }

    if (filters.date_from) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate >= filters.date_from;
      });
    }

    if (filters.date_to) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate <= filters.date_to;
      });
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      username: '',
      action: '',
      entity_type: '',
      date_from: '',
      date_to: ''
    });
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-700';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'SIGN':
        return 'bg-purple-100 text-purple-700';
      case 'VIEW':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
          <p className="mt-3 text-slate-600">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="audit-trail-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-cyan-600" />
            Audit Trail
          </h1>
          <p className="text-slate-600">
            Complete audit log of all system activities ({filteredLogs.length} records)
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-slate-300"
          data-testid="toggle-filters-button"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-0 shadow-lg" data-testid="filters-card">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Filter Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter_username" className="text-slate-700">Username</Label>
                <Input
                  id="filter_username"
                  name="username"
                  placeholder="Search by username"
                  value={filters.username}
                  onChange={handleFilterChange}
                  className="border-slate-300"
                  data-testid="filter-username-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter_action" className="text-slate-700">Action Type</Label>
                <select
                  id="filter_action"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  data-testid="filter-action-select"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="SIGN">SIGN</option>
                  <option value="VIEW">VIEW</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter_entity_type" className="text-slate-700">Entity Type</Label>
                <select
                  id="filter_entity_type"
                  name="entity_type"
                  value={filters.entity_type}
                  onChange={handleFilterChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  data-testid="filter-entity-select"
                >
                  <option value="">All Types</option>
                  <option value="test">Test</option>
                  <option value="batch">Batch</option>
                  <option value="specification">Specification</option>
                  <option value="equipment">Equipment</option>
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

      {/* Audit Log Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg" data-testid="total-activities-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Activities</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{filteredLogs.length}</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <Activity className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" data-testid="unique-users-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Unique Users</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {new Set(filteredLogs.map(log => log.username)).size}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" data-testid="time-range-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Time Range</p>
                <p className="text-sm font-semibold text-slate-800 mt-2">
                  {filteredLogs.length > 0
                    ? `${new Date(filteredLogs[filteredLogs.length - 1].timestamp).toLocaleDateString()} - ${new Date(filteredLogs[0].timestamp).toLocaleDateString()}`
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="border-0 shadow-lg" data-testid="audit-log-table">
        <CardHeader>
          <CardTitle className="text-slate-800">Activity Log</CardTitle>
          <CardDescription>Detailed record of all system activities and user actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Timestamp</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">User</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-700 text-sm">Action</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Entity Type</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 text-sm">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          {log.username}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 capitalize">{log.entity_type}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <div className="max-w-md">
                            {Object.entries(log.details).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                <strong className="text-slate-700">{key}:</strong> {value?.toString() || 'N/A'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">No details</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Note */}
      <Card className="border-0 shadow-lg border-l-4 border-l-cyan-600" data-testid="compliance-note">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-100 rounded-full">
              <FileSearch className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">21 CFR Part 11 Compliance</h3>
              <p className="text-sm text-slate-600">
                This audit trail maintains a secure, computer-generated, time-stamped record of all operator actions and system activities.
                All records are tamper-proof and meet FDA requirements for electronic records and signatures.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                <strong>Data Retention:</strong> Audit logs are retained for a minimum of 3 years or as required by applicable regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrail;
