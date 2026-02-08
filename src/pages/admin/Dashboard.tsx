import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, ArrowRightLeft, Search, FileText, LogOut, FileCheck, Clock, Users, ArrowUpDown, Bell, Settings, ChevronRight, Key } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MainLayout from '@/components/layout/MainLayout';
import Sidebar from '@/components/layout/Sidebar';

import { AuditLogEntry, DeedRecord } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('isAdminLoggedIn');
      navigate('/');
    }
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeeds: 0,
    pendingTransfers: 0,
    todayVerifications: 0,
    activeUsers: 1, // Default to 1 (current admin)
  });
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
      if (!isLoggedIn) {
        navigate('/admin/login');
        return;
      }

      try {
        const [deedsRes, auditRes] = await Promise.all([
          api.get('/deeds'),
          api.get('/audit')
        ]);

        const deeds = deedsRes.data;
        // Audit Logs API now returns { logs, totalPages, ... }
        // We use a larger limit for dashboard stats to get a reasonable sample, 
        // essentially treating it as "recent" stats.
        // Ideally we would have a dedicated /stats endpoint.
        const auditLogs = auditRes.data.logs || [];

        // Calculate Stats
        const totalDeeds = deeds.length;
        const pendingTransfers = deeds.filter((d: DeedRecord) => d.status === 'pending').length; // Assuming 'pending' status exists or we infer it

        // Today's verifications
        const today = new Date().toDateString();
        const todayVerifications = auditLogs.filter((log: AuditLogEntry) =>
          log.action === 'verify' && new Date(log.timestamp).toDateString() === today
        ).length;

        // Active Users (Distinct users in logs)
        const uniqueUsers = new Set(auditLogs.map((log: AuditLogEntry) => log.performedBy));

        setStats({
          totalDeeds,
          pendingTransfers, // Or maybe check logs for transfer requests? For now, deeds status.
          todayVerifications,
          activeUsers: uniqueUsers.size || 1
        });

        setRecentActivity(auditLogs.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const statsCards = [
    {
      label: t.dashboard.stats.totalDeeds,
      value: stats.totalDeeds,
      icon: FileCheck,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-600'
    },
    {
      label: t.dashboard.stats.pendingTransfers,
      value: stats.pendingTransfers,
      icon: ArrowUpDown,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600'
    },
    {
      label: t.dashboard.stats.todayVerifications,
      value: stats.todayVerifications,
      icon: Search,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600'
    },
    {
      label: t.dashboard.stats.activeUsers,
      value: stats.activeUsers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-500/10',
      text: 'text-purple-600'
    },
  ];





  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <Sidebar />

          {/* Mobile Nav (visible only on small screens) */}
          <div className="lg:hidden">
            <Sidebar mobile className="mb-6" />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.welcome}</h1>
                <p className="text-muted-foreground mt-1">Here's what's happening in the registry today.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="rounded-full relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background"></span>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
                <div className="text-sm text-right hidden md:block">
                  <p className="font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((stat, index) => (
                <div
                  key={index}
                  className="glass-card rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group"
                >
                  <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${stat.text}`}>
                    <stat.icon className="w-24 h-24 -mr-8 -mt-8" />
                  </div>

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.text} flex items-center justify-center mb-4 shadow-sm`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass border-0 shadow-lg">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          {t.dashboard.recentActivity}
                        </CardTitle>
                        <CardDescription>Latest transactions recorded on the immutable ledger</CardDescription>
                      </div>
                      {localStorage.getItem('userRole') === 'superadmin' && (
                        <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => navigate('/admin/audit')}>
                          View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/40">
                      {recentActivity.map((activity) => (
                        <div key={activity._id || activity.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.action === 'register' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                              activity.action === 'transfer' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                activity.action === 'login' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                  activity.action === 'logout' ? 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' :
                                    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                              {activity.action === 'register' ? <FilePlus className="w-5 h-5" /> :
                                activity.action === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> :
                                  activity.action === 'login' ? <Key className="w-5 h-5" /> :
                                    activity.action === 'logout' ? <LogOut className="w-5 h-5" /> :
                                      <FileCheck className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                Deed #{activity.deedNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t.audit.actions[activity.action]} • <span className="text-foreground/80">{activity.performedBy}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                              {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks for administrators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full justify-start h-12 text-base shadow-md" onClick={() => navigate('/admin/register')}>
                      <FilePlus className="w-5 h-5 mr-3" />
                      {t.dashboard.menu.registerDeed}
                    </Button>
                    <Button variant="secondary" className="w-full justify-start h-12 text-base bg-background/50 hover:bg-background" onClick={() => navigate('/admin/transfer')}>
                      <ArrowRightLeft className="w-5 h-5 mr-3" />
                      {t.dashboard.menu.transferDeed}
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 text-base border-primary/20 hover:border-primary/50" onClick={() => navigate('/admin/search')}>
                      <Search className="w-5 h-5 mr-3" />
                      {t.dashboard.menu.searchDeeds}
                    </Button>
                  </CardContent>
                </Card>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2">System Status</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-sm font-medium text-green-400">Operational</span>
                    </div>
                    <div className="space-y-2 text-sm text-indigo-200">
                      <div className="flex justify-between">
                        <span>Database</span>
                        <span className="text-white">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification Node</span>
                        <span className="text-white">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Backup</span>
                        <span className="text-white">2 mins ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
