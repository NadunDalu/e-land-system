import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ArrowRightLeft, Search, FileText, LogOut,
  UserCheck, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Building, MapPin, Ruler
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { DeedRecord } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TransferOwnership = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [searchDeedNumber, setSearchDeedNumber] = useState('');
  const [foundDeed, setFoundDeed] = useState<DeedRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [newOwnerData, setNewOwnerData] = useState({
    ownerName: '',
    ownerNIC: '',
    transferReason: '',
  });

  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn) {
      navigate('/admin/login');
    }
  }, [navigate]);

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

  const menuItems = [
    { icon: LayoutDashboard, label: t.dashboard.menu.overview, path: '/admin/dashboard' },
    { icon: FilePlus, label: t.dashboard.menu.registerDeed, path: '/admin/register' },
    { icon: ArrowRightLeft, label: t.dashboard.menu.transferDeed, path: '/admin/transfer' },
    { icon: Search, label: t.dashboard.menu.searchDeeds, path: '/admin/search' },
    { icon: FileText, label: t.dashboard.menu.auditLogs, path: '/admin/audit' },
  ];

  const handleSearchDeed = async () => {
    setIsSearching(true);
    setSearchError('');
    setFoundDeed(null);

    try {
      // Search by landTitleNumber or deedNumber? The UI placeholder says 'land title number'
      // But let's support searching by any relevant field if the backend supports it.
      // For now, let's assume the input is searched against multiple fields in the backend if we use 'search' param,
      // OR we search specifically by 'landTitleNumber'.
      // The backend 'search' query param matches deedNumber, landTitleNumber, ownerNIC.
      const response = await api.get(`/deeds?search=${searchDeedNumber}`);

      if (response.data && response.data.length > 0) {
        // Find exact match if possible, or just take the first result
        // For strictness, let's look for exact match on landTitleNumber if possible
        const exactMatch = response.data.find((d: DeedRecord) =>
          d.landTitleNumber.toLowerCase() === searchDeedNumber.toLowerCase()
        );
        setFoundDeed(exactMatch || response.data[0]);
      } else {
        setSearchError(t.verify.result.notFound);
      }
    } catch (error) {
      console.error('Error searching deed:', error);
      setSearchError('Error searching for deed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewOwnerData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransferConfirm = async () => {
    setShowConfirmDialog(false);
    setIsTransferring(true);

    if (!foundDeed) return;

    try {
      await api.put('/deeds/transfer', {
        deedId: foundDeed._id || foundDeed.id, // Ensure we use the correct ID field from Mongo
        newOwnerName: newOwnerData.ownerName,
        newOwnerNIC: newOwnerData.ownerNIC,
        transferReason: newOwnerData.transferReason
      });

      toast({
        title: t.common.success,
        description: 'Ownership transfer successfully recorded in the system',
      });

      // Reset form
      setFoundDeed(null);
      setSearchDeedNumber('');
      setNewOwnerData({
        ownerName: '',
        ownerNIC: '',
        transferReason: '',
      });
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error.response?.data?.message || "Could not transfer ownership. Please try again.",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const isTransferFormValid =
    newOwnerData.ownerName.trim() !== '' &&
    newOwnerData.ownerNIC.trim() !== '' &&
    newOwnerData.transferReason.trim() !== '';

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
            <h1 className="text-3xl font-bold tracking-tight mb-6">{t.dashboard.menu.transferDeed}</h1>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Deed Lookup */}
              <Card className="glass border-0 shadow-lg h-full">
                <CardHeader className="border-b border-border/40 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Search className="w-5 h-5 text-primary" />
                    Find Existing Deed
                  </CardTitle>
                  <CardDescription>
                    Search for the deed record to initiate ownership transfer
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter land title number (e.g., LT/WP/COL/2024/00001)"
                        value={searchDeedNumber}
                        onChange={(e) => setSearchDeedNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchDeed()}
                        className="pl-9 bg-background/50 h-10"
                      />
                    </div>
                    <Button onClick={handleSearchDeed} disabled={isSearching || !searchDeedNumber} className="h-10 px-6">
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </Button>
                  </div>

                  {searchError && (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">{searchError}</p>
                    </div>
                  )}

                  {foundDeed && (
                    <div className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/50 to-muted/10 p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-start justify-between pb-3 border-b border-border/40">
                        <div>
                          <h3 className="font-bold text-lg text-primary">{foundDeed.landTitleNumber}</h3>
                          <p className="text-sm text-foreground/80 font-medium">Deed #{foundDeed.deedNumber}</p>
                        </div>
                        <Badge variant={foundDeed.status === 'valid' ? 'default' : 'secondary'} className={foundDeed.status === 'valid' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {foundDeed.status === 'valid' ? t.verify.result.valid : t.verify.result.invalid}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-1">Current Owner</span>
                          <p className="font-medium text-foreground">{foundDeed.ownerName}</p>
                          <p className="text-xs text-muted-foreground">{foundDeed.ownerNIC}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-1">Land Details</span>
                          <p className="font-medium text-foreground flex items-center gap-1">
                            <Ruler className="w-3 h-3 text-muted-foreground" /> {foundDeed.landArea}
                          </p>
                          <p className="text-xs text-muted-foreground">{foundDeed.district}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-1">Location</span>
                          <p className="font-medium text-foreground flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" /> {foundDeed.landLocation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* New Owner Details */}
              <Card className={`glass border-0 shadow-lg ${!foundDeed ? 'opacity-60 grayscale pointer-events-none' : ''} transition-all duration-300`}>
                <CardHeader className="border-b border-border/40 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserCheck className="w-5 h-5 text-primary" />
                    New Owner Details
                  </CardTitle>
                  <CardDescription>
                    Enter the details of the new property owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerName">{t.register.ownerName} <span className="text-destructive">*</span></Label>
                    <Input
                      id="newOwnerName"
                      placeholder="Full legal name of new owner"
                      value={newOwnerData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      disabled={!foundDeed}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newOwnerNIC">{t.register.ownerNIC} <span className="text-destructive">*</span></Label>
                    <Input
                      id="newOwnerNIC"
                      placeholder="NIC number of new owner"
                      value={newOwnerData.ownerNIC}
                      onChange={(e) => handleInputChange('ownerNIC', e.target.value)}
                      disabled={!foundDeed}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transferReason">Transfer Reason <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="transferReason"
                      placeholder="e.g., Sale of property, Inheritance, Gift"
                      value={newOwnerData.transferReason}
                      onChange={(e) => handleInputChange('transferReason', e.target.value)}
                      disabled={!foundDeed}
                      rows={3}
                      className="bg-background/50 resize-none"
                    />
                  </div>

                  {foundDeed && (
                    <div className="pt-4 border-t border-border/40">
                      <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                        <div className="text-right flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">From</p>
                          <p className="font-semibold text-sm truncate">{foundDeed.ownerName}</p>
                        </div>
                        <div className="bg-background p-2 rounded-full shadow-sm border">
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">To</p>
                          <p className="font-semibold text-sm truncate">{newOwnerData.ownerName || '—'}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={!isTransferFormValid || isTransferring}
                        className="w-full h-11 text-base shadow-lg shadow-primary/20"
                      >
                        {isTransferring ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing Transfer...
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Initiate Transfer
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Confirm Ownership Transfer
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>You are about to transfer ownership of land title <strong className="text-foreground">{foundDeed?.landTitleNumber}</strong>.</p>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium text-foreground">{foundDeed?.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium text-foreground">{newOwnerData.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium text-foreground">{newOwnerData.transferReason}</span>
                </div>
              </div>
              <p className="text-destructive font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                This action is irreversible and recorded on the blockchain.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransferConfirm} className="bg-primary hover:bg-primary/90">
              {t.common.confirm} Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default TransferOwnership;
