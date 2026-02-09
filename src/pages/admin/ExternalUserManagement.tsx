import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  UserCheck, 
  UserX,
  Calendar,
  MapPin,
  Scale,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import Sidebar from '@/components/layout/Sidebar';
import api from '@/lib/api';

interface ExternalUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  username: string;
  profession: string;
  gender: string;
  province: string;
  district: string;
  registrationStatus: 'pending' | 'approved' | 'rejected';
  emailVerified: boolean;
  registrationDate: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

const ExternalUserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<ExternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ExternalUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const userRole = localStorage.getItem('userRole');
    
    if (!isLoggedIn) {
      navigate('/admin/login');
      return;
    } else if (userRole !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "You need superadmin privileges to access this page.",
        variant: "destructive",
      });
      navigate('/admin/dashboard');
      return;
    }

    fetchPendingUsers();
  }, [navigate, toast]);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/auth/pending-registrations');
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/auth/approve-registration/${userId}`);
      
      toast({
        title: "Success",
        description: "User registration approved successfully",
      });
      
      // Remove from pending list
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/auth/reject-registration/${userId}`, {
        reason: rejectionReason
      });
      
      toast({
        title: "Success",
        description: "User registration rejected",
      });
      
      // Remove from pending list
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
      setRejectionReason('');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getProfessionIcon = (profession: string) => {
    return profession === 'lawyer' ? Scale : Users;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar />
          <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              External User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and approve external user registrations
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Registrations</p>
                  <p className="text-2xl font-bold">{pendingUsers.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lawyers</p>
                  <p className="text-2xl font-bold">
                    {pendingUsers.filter(u => u.profession === 'lawyer').length}
                  </p>
                </div>
                <Scale className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notaries</p>
                  <p className="text-2xl font-bold">
                    {pendingUsers.filter(u => u.profession === 'notary').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Registrations ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending registrations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => {
                  const ProfessionIcon = getProfessionIcon(user.profession);
                  return (
                    <div
                      key={user._id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <ProfessionIcon className="w-5 h-5 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">{user.fullName}</h3>
                            </div>
                            <Badge className={getStatusBadge(user.registrationStatus)}>
                              {user.registrationStatus}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Username:</span>
                              <span className="font-mono">{user.username}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Scale className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Profession:</span>
                              <span className="capitalize">{user.profession}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Location:</span>
                              <span>{user.district}, {user.province}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Applied:</span>
                              <span>{new Date(user.registrationDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Email:</span>
                              <span>{user.email}</span>
                              {user.emailVerified ? (
                                <span title="Email Verified">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </span>
                              ) : (
                                <span title="Email Not Verified">
                                  <XCircle className="w-4 h-4 text-red-500" />
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Phone:</span>
                              <span>{user.phoneNumber}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Registration Details</DialogTitle>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Full Name
                                      </Label>
                                      <p className="font-medium">{selectedUser.fullName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Username
                                      </Label>
                                      <p className="font-mono">{selectedUser.username}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Profession
                                      </Label>
                                      <p className="capitalize">{selectedUser.profession}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Gender
                                      </Label>
                                      <p className="capitalize">{selectedUser.gender}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Province
                                      </Label>
                                      <p>{selectedUser.province}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        District
                                      </Label>
                                      <p>{selectedUser.district}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Registration Date
                                      </Label>
                                      <p>{new Date(selectedUser.registrationDate).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Status
                                      </Label>
                                      <Badge className={getStatusBadge(selectedUser.registrationStatus)}>
                                        {selectedUser.registrationStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button 
                            size="sm"
                            onClick={() => handleApprove(user._id)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setRejectionReason('');
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Registration</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-red-600" />
                                  <p className="text-sm text-red-600 dark:text-red-400">
                                    You are about to reject the registration for <strong>{selectedUser?.fullName}</strong>
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
                                  <Textarea
                                    id="rejectionReason"
                                    placeholder="Please provide a clear reason for rejecting this registration..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <DialogTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => selectedUser && handleReject(selectedUser._id)}
                                    disabled={actionLoading || !rejectionReason.trim()}
                                  >
                                    {actionLoading ? 'Rejecting...' : 'Reject Registration'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExternalUserManagement;