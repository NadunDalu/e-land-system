import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, User, Key, ShieldAlert, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/lib/api';
import logo from '@/assets/logo.png';

const AdminLogin = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });

      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.user.role);

      if (response.data.user.mustChangePassword) {
        navigate('/admin/change-password');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Login Error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || err.message || t.login.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4">
        <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30">
              <img src={logo} alt="E-Land Registry Logo" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.login.title}</h1>
            <p className="text-muted-foreground mt-2">{t.login.subtitle}</p>
          </div>

          <Card className="glass overflow-hidden border-0 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning via-orange-500 to-warning"></div>
            <CardContent className="pt-8 px-8 pb-8">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-8 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#C3700C] mb-1">{t.login.warning}</h3>
                  <p className="text-xs text-muted-foreground">Restricted area for authorized government officials only. All actions are logged and monitored.</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground/80">{t.login.username}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-input/60 focus:ring-primary/20 transition-all rounded-lg"
                      required
                      placeholder="Enter your government ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground/80">{t.login.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-input/60 focus:ring-primary/20 transition-all rounded-lg"
                      required
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp" className="text-foreground/80">{t.login.otp}</Label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Optional</span>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-input/60 focus:ring-primary/20 transition-all rounded-lg tracking-widest font-mono"
                      placeholder="000 000"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base font-medium shadow-lg hover:shadow-primary/20 transition-all mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t.common.loading}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{t.login.button}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-border/40 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  <span className="opacity-70">Authorized Personnel Only</span>
                </p>
                <div className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>256-bit Secure SSL Connection</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminLogin;
