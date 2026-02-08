import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ArrowRightLeft, Search, FileText, LogOut,
  Eye, MapPin, Calendar, Filter, X, Edit, Save, Loader2, Trash2, CheckCircle2
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
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<DeedRecord>>({});

  // Delete State
  const [deedToDelete, setDeedToDelete] = useState<DeedRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);
  const [deletedDeedNumber, setDeletedDeedNumber] = useState('');

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchDeeds();
  }, [searchFilters]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    if (!isLoggedIn) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Logout logic handled in Sidebar
  // Menu items handled in Sidebar

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

  const handleEditDeed = (deed: DeedRecord) => {
    setSelectedDeed(deed);
    setEditFormData({ ...deed });
    setShowEditDialog(true);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateDeed = async () => {
    if (!selectedDeed) return;
    setIsUpdating(true);
    try {
      const { _id, id, ...rest } = editFormData; // Avoid sending ID in body if not needed, but we use ID in params
      const deedId = _id || id;

      await api.put(`/deeds/${deedId}`, editFormData);

      toast({
        title: t.common.success,
        description: "Deed updated successfully",
      });

      setShowEditDialog(false);
      fetchDeeds(); // Refresh list
    } catch (error) {
      console.error('Error updating deed:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update deed details.",
      });
    } finally {
      setIsUpdating(false);
    }
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDeed(deed)}
                                className="h-8 gap-1 hover:border-blue-500/50 hover:text-blue-600 transition-colors ml-2"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span className="sr-only sm:not-sr-only">Edit</span>
                              </Button>


                              {userRole === 'superadmin' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeedToDelete(deed)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              )}
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

      {/* Edit Deed Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5 text-primary" />
              Edit Deed Details
            </DialogTitle>
            <DialogDescription>
              Update record information for land title <span className="font-mono text-primary">{selectedDeed?.landTitleNumber}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ownerName">Owner Name</Label>
                <Input
                  id="edit-ownerName"
                  value={editFormData.ownerName || ''}
                  onChange={(e) => handleEditInputChange('ownerName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ownerNIC">Owner NIC</Label>
                <Input
                  id="edit-ownerNIC"
                  value={editFormData.ownerNIC || ''}
                  onChange={(e) => handleEditInputChange('ownerNIC', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-landArea">Land Area</Label>
                <Input
                  id="edit-landArea"
                  value={editFormData.landArea || ''}
                  onChange={(e) => handleEditInputChange('landArea', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-surveyRef">Survey Reference</Label>
                <Input
                  id="edit-surveyRef"
                  value={editFormData.surveyRef || ''}
                  onChange={(e) => handleEditInputChange('surveyRef', e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-landLocation">Location</Label>
                <Input
                  id="edit-landLocation"
                  value={editFormData.landLocation || ''}
                  onChange={(e) => handleEditInputChange('landLocation', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDeed}
                disabled={isUpdating}
                className="bg-primary hover:bg-primary/90"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deedToDelete} onOpenChange={(open) => !open && setDeedToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deed Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete deed <strong>{deedToDelete?.deedNumber}</strong>?
              This action cannot be undone and will be permanently logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteDeed();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Record'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Success Dialog */}
      <Dialog open={showDeleteSuccessDialog} onOpenChange={setShowDeleteSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">Deed Deleted</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Deed record <strong>{deletedDeedNumber}</strong> has been permanently removed from the registry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pt-4">
            <Button
              type="button"
              className="w-full sm:w-auto min-w-[120px]"
              onClick={() => setShowDeleteSuccessDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout >
  );
};

export default SearchDeeds;
