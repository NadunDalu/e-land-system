import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ArrowRightLeft, Search, FileText, LogOut,
  Filter, Download, RefreshCw, X, History
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import MainLayout from '@/components/layout/MainLayout';
import Sidebar from '@/components/layout/Sidebar';
import { AuditLogEntry } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const AuditLogs = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const { toast } = useToast();

  const [searchFilters, setSearchFilters] = useState({
    deedNumber: '',
    action: '',
    performedBy: '',
  });

  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    // Client-side filtering
    let filtered = [...allLogs];

    if (searchFilters.deedNumber) {
      filtered = filtered.filter(log =>
        log.deedNumber.toLowerCase().includes(searchFilters.deedNumber.toLowerCase())
      );
    }

    if (searchFilters.action && searchFilters.action !== 'All') {
      filtered = filtered.filter(log => log.action === searchFilters.action);
    }

    if (searchFilters.performedBy) {
      filtered = filtered.filter(log =>
        log.performedBy.toLowerCase().includes(searchFilters.performedBy.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [searchFilters, allLogs]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const userRole = localStorage.getItem('userRole');

    if (!isLoggedIn) {
      navigate('/admin/login');
    } else if (userRole !== 'superadmin') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to view audit logs."
      });
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  // Logout logic handled in Sidebar
  // Menu items handled in Sidebar

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/audit');
      setAllLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch audit logs.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      deedNumber: '',
      action: '',
      performedBy: '',
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'register':
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">{t.audit.actions.register}</Badge>;
      case 'transfer':
        return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200 dark:text-amber-400 dark:border-amber-800">{t.audit.actions.transfer}</Badge>;
      case 'update':
        return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200 dark:text-blue-400 dark:border-blue-800">{t.audit.actions.update}</Badge>;
      case 'verify':
        return <Badge variant="outline">{t.audit.actions.verify}</Badge>;
      case 'login':
        return <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200 dark:text-purple-400 dark:border-purple-800">{t.audit.actions.login}</Badge>;
      case 'logout':
        return <Badge className="bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200 dark:text-gray-400 dark:border-gray-800">Logout</Badge>;
      case 'create user':
        return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200 dark:text-green-400 dark:border-green-800">Create User</Badge>;
      case 'delete user':
        return <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200 dark:text-red-400 dark:border-red-900">Delete User</Badge>;
      case 'delete deed':
        return <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200 dark:text-red-400 dark:border-red-800">Delete Deed</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <Sidebar />

          {/* Mobile Nav */}
          <div className="lg:hidden">
            <Sidebar mobile className="mb-6" />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-3xl font-bold tracking-tight">{t.audit.title}</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-background/50 backdrop-blur-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="bg-background/50 backdrop-blur-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6 glass border-0 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <History className="w-32 h-32 -mr-8 -mt-8" />
              </div>
              <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-primary" />
                  Filter Log Entries
                  {(searchFilters.deedNumber || (searchFilters.action && searchFilters.action !== 'All') || searchFilters.performedBy) && (
                    <Badge variant="secondary" className="ml-2 text-xs font-normal">Active</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.audit.deedNumber}</Label>
                    <Input
                      placeholder="Search by deed number"
                      value={searchFilters.deedNumber}
                      onChange={(e) => handleFilterChange('deedNumber', e.target.value)}
                      className="bg-background/50 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.audit.action}</Label>
                    <Select
                      value={searchFilters.action}
                      onValueChange={(value) => handleFilterChange('action', value)}
                    >
                      <SelectTrigger className="bg-background/50 h-9">
                        <SelectValue placeholder="All Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Actions</SelectItem>
                        <SelectItem value="register">{t.audit.actions.register}</SelectItem>
                        <SelectItem value="transfer">{t.audit.actions.transfer}</SelectItem>
                        <SelectItem value="update">{t.audit.actions.update}</SelectItem>
                        <SelectItem value="verify">{t.audit.actions.verify}</SelectItem>
                        <SelectItem value="login">{t.audit.actions.login}</SelectItem>
                        <SelectItem value="logout">Logout</SelectItem>
                        <SelectItem value="create user">Create User</SelectItem>
                        <SelectItem value="delete user">Delete User</SelectItem>
                        <SelectItem value="delete deed">Delete Deed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.audit.performedBy}</Label>
                    <Input
                      placeholder="Search by user"
                      value={searchFilters.performedBy}
                      onChange={(e) => handleFilterChange('performedBy', e.target.value)}
                      className="bg-background/50 h-9"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6 pt-2 border-t border-border/40">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card className="glass border-0 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                <CardTitle className="text-lg">
                  Transaction History <span className="text-muted-foreground font-normal text-sm ml-2">({filteredLogs.length} events)</span>
                </CardTitle>
                <CardDescription>
                  Immutable record of all system activities
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium text-lg">{t.common.noResults}</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-semibold">{t.audit.transactionId}</TableHead>
                          <TableHead className="font-semibold">{t.audit.deedNumber}</TableHead>
                          <TableHead className="font-semibold">{t.audit.action}</TableHead>
                          <TableHead className="font-semibold">{t.audit.performedBy}</TableHead>
                          <TableHead className="font-semibold">{t.audit.timestamp}</TableHead>
                          <TableHead className="font-semibold">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => {
                          const { date, time } = formatTimestamp(log.timestamp);
                          return (
                            <TableRow key={log._id || log.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-mono text-xs text-primary">{log.transactionId}</TableCell>
                              <TableCell className="font-medium">{log.deedNumber}</TableCell>
                              <TableCell>{getActionBadge(log.action)}</TableCell>
                              <TableCell>{log.performedBy}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{date}</div>
                                  <div className="text-xs text-muted-foreground">{time}</div>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                {log.details || '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default AuditLogs;
