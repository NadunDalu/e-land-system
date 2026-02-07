import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ArrowRightLeft, Search, FileText, LogOut,
  Eye, MapPin, Calendar, Filter, X
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MainLayout from '@/components/layout/MainLayout';
import { DeedRecord } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const SearchDeeds = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const { toast } = useToast();

  const [searchFilters, setSearchFilters] = useState({
    landTitleNumber: '',
    deedNumber: '',
    ownerName: '',
    district: '',
    status: '',
  });

  const [filteredDeeds, setFilteredDeeds] = useState<DeedRecord[]>([]);
  const [selectedDeed, setSelectedDeed] = useState<DeedRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDeeds();
  }, [searchFilters]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t.dashboard.menu.overview, path: '/admin/dashboard' },
    { icon: FilePlus, label: t.dashboard.menu.registerDeed, path: '/admin/register' },
    { icon: ArrowRightLeft, label: t.dashboard.menu.transferDeed, path: '/admin/transfer' },
    { icon: Search, label: t.dashboard.menu.searchDeeds, path: '/admin/search' },
    { icon: FileText, label: t.dashboard.menu.auditLogs, path: '/admin/audit' },
  ];

  const districts = ['All', 'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Kurunegala'];

  const fetchDeeds = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchFilters.landTitleNumber) params.append('landTitleNumber', searchFilters.landTitleNumber);
      if (searchFilters.deedNumber) params.append('deedNumber', searchFilters.deedNumber);
      if (searchFilters.ownerName) params.append('ownerName', searchFilters.ownerName);
      if (searchFilters.district && searchFilters.district !== 'All') params.append('district', searchFilters.district);
      if (searchFilters.status && searchFilters.status !== 'All') params.append('status', searchFilters.status);

      const response = await api.get(`/deeds?${params.toString()}`);
      setFilteredDeeds(response.data);
    } catch (error) {
      console.error('Error fetching deeds:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch deeds. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDeed = (deed: DeedRecord) => {
    setSelectedDeed(deed);
    setShowDetailsDialog(true);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      landTitleNumber: '',
      deedNumber: '',
      ownerName: '',
      district: '',
      status: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">{t.verify.result.valid}</Badge>;
      case 'invalid':
        return <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/20">{t.verify.result.invalid}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200 dark:text-amber-400 dark:border-amber-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 space-y-8">
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary hidden lg:block">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-xl text-primary">AD</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Admin Portal</h3>
                  <p className="text-xs text-muted-foreground">Government Officer</p>
                </div>
              </div>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${location.pathname === item.path
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <item.icon className="w-5 h-5 relative z-10" />
                    <span className="font-medium relative z-10">{item.label}</span>
                    {location.pathname === item.path && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-100 z-0"></div>
                    )}
                  </Link>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border/40">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 w-full transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t.nav.logout}</span>
                </button>
              </div>
            </div>

            {/* Mobile Nav */}
            <div className="lg:hidden glass-card rounded-xl p-4 flex overflow-x-auto gap-4 scrollbar-hide">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center min-w-[5rem] p-3 rounded-xl gap-2 transition-colors ${location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                    }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium text-center truncate w-full">{item.label}</span>
                </Link>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight mb-6">{t.dashboard.menu.searchDeeds}</h1>

            {/* Search Filters */}
            <Card className="mb-6 glass border-0 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Filter className="w-32 h-32 -mr-8 -mt-8" />
              </div>
              <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-primary" />
                  Filter Records
                  {(searchFilters.landTitleNumber || searchFilters.deedNumber || searchFilters.ownerName || (searchFilters.district && searchFilters.district !== 'All') || (searchFilters.status && searchFilters.status !== 'All')) && (
                    <Badge variant="secondary" className="ml-2 text-xs font-normal">Active</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.register.landTitleNumber}</Label>
                    <Input
                      placeholder="Search title..."
                      value={searchFilters.landTitleNumber}
                      onChange={(e) => handleFilterChange('landTitleNumber', e.target.value)}
                      className="bg-background/50 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.register.deedNumber}</Label>
                    <Input
                      placeholder="Search deed..."
                      value={searchFilters.deedNumber}
                      onChange={(e) => handleFilterChange('deedNumber', e.target.value)}
                      className="bg-background/50 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.register.ownerName}</Label>
                    <Input
                      placeholder="Search owner..."
                      value={searchFilters.ownerName}
                      onChange={(e) => handleFilterChange('ownerName', e.target.value)}
                      className="bg-background/50 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">District</Label>
                    <Select
                      value={searchFilters.district}
                      onValueChange={(value) => handleFilterChange('district', value)}
                    >
                      <SelectTrigger className="bg-background/50 h-9">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map(district => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</Label>
                    <Select
                      value={searchFilters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger className="bg-background/50 h-9">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="valid">Valid</SelectItem>
                        <SelectItem value="invalid">Invalid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end mt-4 pt-2 border-t border-border/40">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Table */}
            <Card className="glass border-0 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                <CardTitle className="text-lg">
                  Search Results <span className="text-muted-foreground font-normal text-sm ml-2">({filteredDeeds.length} records found)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredDeeds.length === 0 ? (
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
                          <TableHead className="font-semibold">{t.register.landTitleNumber}</TableHead>
                          <TableHead className="font-semibold">{t.register.deedNumber}</TableHead>
                          <TableHead className="font-semibold">{t.register.ownerName}</TableHead>
                          <TableHead className="font-semibold">District</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeeds.map((deed) => (
                          <TableRow key={deed.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-primary">{deed.landTitleNumber}</TableCell>
                            <TableCell>{deed.deedNumber}</TableCell>
                            <TableCell>{deed.ownerName}</TableCell>
                            <TableCell>{deed.district}</TableCell>
                            <TableCell>{getStatusBadge(deed.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDeed(deed)}
                                className="h-8 gap-1 hover:border-primary/50 hover:text-primary transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="sr-only sm:not-sr-only">{t.common.view}</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Deed Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-5 h-5 text-primary" />
              Deed Details
            </DialogTitle>
            <DialogDescription>
              Complete record information for land title <span className="font-mono text-primary">{selectedDeed?.landTitleNumber}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedDeed && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Status</span>
                  {getStatusBadge(selectedDeed.status)}
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Registration Date</span>
                  <p className="font-medium flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {new Date(selectedDeed.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.register.deedNumber}</p>
                  <p className="font-medium text-base">{selectedDeed.deedNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.register.ownerName}</p>
                  <p className="font-medium text-base">{selectedDeed.ownerName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.register.ownerNIC}</p>
                  <p className="font-medium text-base font-mono bg-muted/50 px-2 py-0.5 rounded inline-block">{selectedDeed.ownerNIC}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.register.surveyRef}</p>
                  <p className="font-medium text-base">{selectedDeed.surveyRef}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> {t.register.landLocation}
                  </p>
                  <p className="font-medium bg-muted/20 p-3 rounded-lg border border-border/40">{selectedDeed.landLocation}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">District / Province</p>
                  <p className="font-medium">{selectedDeed.district}, {selectedDeed.province}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t.register.landArea}</p>
                  <p className="font-medium">{selectedDeed.landArea}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">{t.verify.result.blockchainHash}</p>
                <code className="text-[10px] sm:text-xs break-all bg-muted p-3 rounded-lg block font-mono text-primary/80 border border-border/50">
                  {selectedDeed.blockchainHash}
                </code>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 shadow-lg shadow-primary/20"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    navigate('/admin/transfer');
                  }}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Transfer Ownership
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default SearchDeeds;
