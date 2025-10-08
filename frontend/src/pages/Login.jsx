import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FlaskConical, Shield, FileCheck, BarChart3 } from 'lucide-react';

const Login = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 'QC Analyst'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API}/auth/login`, {
          username: formData.username,
          password: formData.password
        });
        
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        toast.success('Login successful!');
        navigate('/');
      } else {
        await axios.post(`${API}/auth/register`, formData);
        toast.success('Registration successful! Please login.');
        setIsLogin(true);
        setFormData({ ...formData, password: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden md:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-600 rounded-xl">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800">Pharma QC Portal</h1>
                <p className="text-slate-600 text-lg">Quality Control Record Management</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 mt-12">
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Shield className="w-6 h-6 text-cyan-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">GMP Compliant</h3>
                <p className="text-sm text-slate-600">Meets 21 CFR Part 11 requirements with electronic signatures and audit trails</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Digital Documentation</h3>
                <p className="text-sm text-slate-600">Eliminate paper records with secure, searchable digital test records</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Real-Time Analytics</h3>
                <p className="text-sm text-slate-600">Track quality metrics and trends with comprehensive dashboards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login/Register Form */}
        <Card className="w-full shadow-xl border-0" data-testid="auth-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-800">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {isLogin ? 'Enter your credentials to access the QC portal' : 'Register a new account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="border-slate-300"
                  data-testid="username-input"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="border-slate-300"
                      data-testid="email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-slate-700 font-medium">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Enter full name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="border-slate-300"
                      data-testid="fullname-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-slate-700 font-medium">Role</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      data-testid="role-select"
                    >
                      <option value="QC Analyst">QC Analyst</option>
                      <option value="QC Manager">QC Manager</option>
                      <option value="Admin">Admin</option>
                      <option value="Auditor">Auditor</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="border-slate-300"
                  data-testid="password-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-6 text-base"
                disabled={loading}
                data-testid="submit-button"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                  data-testid="toggle-auth-button"
                >
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
