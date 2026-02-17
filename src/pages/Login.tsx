import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, User, Key, ShieldAlert, ArrowRight, Users, Scale } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/lib/api';
import logo from '@/assets/logo.png';

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  
  // Admin login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // External login state
  const [externalUsername, setExternalUsername] = useState('');
  const [externalPassword, setExternalPassword] = useState('');
  const [externalError, setExternalError] = useState('');
  const [externalLoading, setExternalLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        username: adminUsername, 
        password: adminPassword 
      });

      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('userType', response.data.user.userType || 'internal');
      localStorage.setItem('username', response.data.user.username);

      if (response.data.user.mustChangePassword) {
        navigate('/admin/change-password');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Admin Login Error:', err.response?.data?.message || err.message);
      setAdminError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleExternalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setExternalError('');
    setExternalLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        username: externalUsername, 
        password: externalPassword 
      });

      // Verify this is an external user
      if (response.data.user.userType !== 'external') {
        setExternalError('Invalid credentials for external access');
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
      setExternalError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setExternalLoading(false);
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
              E-Land System
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Secure Land Registry Management
            </p>
          </div>

          {/* Tabbed Login */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Admin Access
              </TabsTrigger>
              <TabsTrigger value="external" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                External Access
              </TabsTrigger>
            </TabsList>

            {/* Admin Login Tab */}
            <TabsContent value="admin">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                      <ShieldAlert className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Administrator Login</h3>
                    <p className="text-sm text-muted-foreground">
                      Full system access for authorized personnel
                    </p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
                    <div className="space-y-2">
                      <Label htmlFor="admin-username">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="admin-username"
                          type="text"
                          placeholder="Enter admin username"
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          className="pl-10"
                          autoComplete="off"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="admin-password"
                          type="password"
                          placeholder="Enter password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="pl-10"
                          autoComplete="off"
                          required
                        />
                      </div>
                    </div>

                    {adminError && (
                      <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        {adminError}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={adminLoading}
                    >
                      {adminLoading ? (
                        'Signing in...'
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* External Login Tab */}
            <TabsContent value="external">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
                      <Scale className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold">External User Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Read-only access for lawyers and notaries
                    </p>
                  </div>

                  <form onSubmit={handleExternalLogin} className="space-y-4" autoComplete="off">
                    <div className="space-y-2">
                      <Label htmlFor="external-username">Username</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="external-username"
                          type="text"
                          placeholder="Enter your username"
                          value={externalUsername}
                          onChange={(e) => setExternalUsername(e.target.value)}
                          className="pl-10"
                          autoComplete="off"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="external-password">Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="external-password"
                          type="password"
                          placeholder="Enter password"
                          value={externalPassword}
                          onChange={(e) => setExternalPassword(e.target.value)}
                          className="pl-10"
                          autoComplete="off"
                          required
                        />
                      </div>
                    </div>

                    {externalError && (
                      <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        {externalError}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      disabled={externalLoading}
                    >
                      {externalLoading ? (
                        'Signing in...'
                      ) : (
                        <>
                          Access Records
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      <strong>Note:</strong> External users have read-only access to land records for verification purposes only.
                    </p>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Prefer a dedicated page? {' '}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-blue-600 hover:text-blue-700"
                        onClick={() => navigate('/external-login')}
                      >
                        Use External Login Page
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;