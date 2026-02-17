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

interface AuditLogEntry {
  _id: string;
  transactionId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
  deedNumber?: string;
}

const ExternalUserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeUsers, setActiveUsers] = useState<ExternalUser[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [pendingUsers, setPendingUsers] = useState<ExternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ExternalUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Activity Log State
  const [userLogs, setUserLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [totalLogPages, setTotalLogPages] = useState(1);

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
    fetchActiveUsers();
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
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const response = await api.get('/auth/active-external-users');
      setActiveUsers(response.data);
    } catch (error) {
      console.error('Error fetching active users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch active users",
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

      // Remove from pending list and refresh active list
      setPendingUsers(prev => prev.filter(user => user._id !== userId));
      fetchActiveUsers();
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

  const fetchUserLogs = async (username: string, page = 1) => {
    setLogsLoading(true);
    try {
      const response = await api.get(`/audit?username=${username}&page=${page}&limit=5`);
      setUserLogs(response.data.logs);
      setTotalLogPages(parseInt(response.data.totalPages));
      setLogPage(page);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user activity logs",
        variant: "destructive",
      });
    } finally {
      setLogsLoading(false);
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
                  Manage external user registrations and active accounts
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
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold">{activeUsers.length}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Lawyers</p>
                      <p className="text-2xl font-bold">
                        {activeUsers.filter(u => u.profession === 'lawyer').length + pendingUsers.filter(u => u.profession === 'lawyer').length}
                      </p>
                    </div>
                    <Scale className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === 'pending'
                  ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-blue-100'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white dark:text-blue-400'
                  }`}
              >
                Pending Registrations ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === 'active'
                  ? 'bg-white text-blue-700 shadow dark:bg-gray-800 dark:text-blue-100'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white dark:text-blue-400'
                  }`}
              >
                Active Users ({activeUsers.length})
              </button>
            </div>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {activeTab === 'pending' ? <Clock className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  {activeTab === 'pending' ? 'Pending Registrations' : 'Active External Users'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTab === 'pending' ? (
                  // Pending Users List
                  pendingUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending registrations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingUsers.map((user) => {
                        const ProfessionIcon = getProfessionIcon(user.profession);
                        return (
                          <div
                            key={user._id}
                            className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                          >
                            <div className="space-y-4">
                              {/* Header Row */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <ProfessionIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{user.fullName}</h3>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusBadge(user.registrationStatus)}>
                                    {user.registrationStatus}
                                  </Badge>
                                  {user.emailVerified ? (
                                    <span title="Email Verified">
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    </span>
                                  ) : (
                                    <span title="Email Not Verified">
                                      <XCircle className="w-5 h-5 text-red-500" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Scale className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Profession:</span>
                                    <span className="font-medium capitalize">{user.profession}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Location:</span>
                                    <span className="font-medium">{user.district}, {user.province}</span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">{user.email}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-medium">{user.phoneNumber}</span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Applied:</span>
                                    <span className="font-medium">{new Date(user.registrationDate).toLocaleDateString()}</span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Gender:</span>
                                    <span className="font-medium capitalize">{user.gender}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-2">
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
                                        <DialogTitle>Registration Details - {selectedUser?.fullName}</DialogTitle>
                                      </DialogHeader>
                                      {selectedUser && (
                                        <div className="space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                                                <p className="font-medium text-lg">{selectedUser.fullName}</p>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                                                <p className="font-mono bg-muted px-2 py-1 rounded text-sm">{selectedUser.username}</p>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                                                <p className="text-blue-600 dark:text-blue-400">{selectedUser.email}</p>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                                                <p>{selectedUser.phoneNumber}</p>
                                              </div>
                                            </div>

                                            <div className="space-y-4">
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Profession</Label>
                                                <p className="capitalize font-medium">{selectedUser.profession}</p>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                                                <p className="capitalize">{selectedUser.gender}</p>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Province</Label>
                                                <p>{selectedUser.province}</p>
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium text-muted-foreground">District</Label>
                                                <p>{selectedUser.district}</p>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                                              <p>{new Date(selectedUser.registrationDate).toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge className={getStatusBadge(selectedUser.registrationStatus)}>
                                                  {selectedUser.registrationStatus}
                                                </Badge>
                                                {selectedUser.emailVerified ? (
                                                  <span title="Email Verified" className="flex items-center gap-1 text-green-600 text-sm">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Email Verified
                                                  </span>
                                                ) : (
                                                  <span title="Email Not Verified" className="flex items-center gap-1 text-red-600 text-sm">
                                                    <XCircle className="w-4 h-4" />
                                                    Email Pending
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(user._id)}
                                    disabled={actionLoading || !user.emailVerified}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                    title={!user.emailVerified ? "Email verification required before approval" : "Approve registration"}
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
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  // Active Users List
                  activeUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No active external users found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeUsers.map((user) => {
                        const ProfessionIcon = getProfessionIcon(user.profession);
                        return (
                          <div key={user._id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full">
                                    <ProfessionIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{user.fullName}</h3>
                                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                  </div>
                                </div>
                                <div>
                                  {user.approvedBy && (
                                    <p className="text-xs text-muted-foreground text-right">
                                      Approved by {user.approvedBy}<br />
                                      {new Date(user.approvedAt || '').toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">Contact</p>
                                  <p className="text-sm font-medium">{user.email}</p>
                                  <p className="text-sm font-medium">{user.phoneNumber}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">Professional Info</p>
                                  <p className="text-sm font-medium capitalize">{user.profession}</p>
                                  <p className="text-sm font-medium">{user.district}, {user.province}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">Actions</p>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          fetchUserLogs(user.username, 1);
                                        }}
                                      >View Activity</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Activity Log - {user.fullName} (@{user.username})</DialogTitle>
                                      </DialogHeader>

                                      <div className="space-y-6 mt-4">
                                        {logsLoading && userLogs.length === 0 ? (
                                          <div className="flex justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                          </div>
                                        ) : userLogs.length === 0 ? (
                                          <div className="text-center py-12 border rounded-lg bg-muted/20">
                                            <p className="text-muted-foreground">No activity logs found for this user.</p>
                                          </div>
                                        ) : (
                                          <div className="space-y-4">
                                            <div className="border rounded-md overflow-hidden">
                                              <table className="w-full text-sm text-left">
                                                <thead className="bg-muted">
                                                  <tr>
                                                    <th className="p-3 font-medium">Date/Time</th>
                                                    <th className="p-3 font-medium">Action</th>
                                                    <th className="p-3 font-medium">Ref No.</th>
                                                    <th className="p-3 font-medium">Details</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y bg-background">
                                                  {userLogs.map((log) => (
                                                    <tr key={log._id} className="hover:bg-muted/50">
                                                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                      </td>
                                                      <td className="p-3 capitalize">
                                                        <Badge variant="outline" className="bg-background">
                                                          {log.action.replace(/_/g, ' ')}
                                                        </Badge>
                                                      </td>
                                                      <td className="p-3 font-mono text-xs text-muted-foreground">{log.transactionId}</td>
                                                      <td className="p-3 text-sm">{log.details}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>

                                            {/* Pagination */}
                                            {totalLogPages > 1 && (
                                              <div className="flex justify-center items-center gap-4 pt-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  disabled={logPage === 1 || logsLoading}
                                                  onClick={() => fetchUserLogs(user.username, logPage - 1)}
                                                >
                                                  Previous
                                                </Button>
                                                <span className="text-sm text-muted-foreground">
                                                  Page {logPage} of {totalLogPages}
                                                </span>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  disabled={logPage === totalLogPages || logsLoading}
                                                  onClick={() => fetchUserLogs(user.username, logPage + 1)}
                                                >
                                                  Next
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
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