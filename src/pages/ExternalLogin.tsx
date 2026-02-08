import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Key, Users, ArrowRight, Scale } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/lib/api';
import logo from '@/assets/logo.png';

const ExternalLogin = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        username, 
        password 
      });

      // Verify this is an external user
      if (response.data.user.userType !== 'external') {
        setError('Invalid credentials for external access. Please use the Admin Login for internal users.');
        return;
      }

      localStorage.setItem('isExternalLoggedIn', 'true');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('userType', 'external');
      localStorage.setItem('username', response.data.user.username);
      localStorage.setItem('profession', response.data.user.profession);

      navigate('/external/search');
    } catch (err: any) {
      console.error('External Login Error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <img src={logo} alt="E-Land System" className="mx-auto h-16 w-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              External Access Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              For Lawyers and Notaries
            </p>
          </div>

          {/* External Login Form */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
                  <Scale className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">External User Access</h3>
                <p className="text-sm text-muted-foreground">
                  Read-only access to land records for verification
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  disabled={loading}
                >
                  {loading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Access Records
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Note:</strong> External users have read-only access to land records for verification purposes only.
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Internal user? {' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 hover:text-blue-700"
                      onClick={() => navigate('/admin/login')}
                    >
                      Use Admin Login
                    </Button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Credentials Info */}
          <Card className="glass-card border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="text-center">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Test Credentials
                </h4>
                <div className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  <p><strong>Lawyer:</strong> lawyer1 / lawyer123</p>
                  <p><strong>Notary:</strong> notary1 / notary123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExternalLogin;