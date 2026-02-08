import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Trash2, UserPlus, ShieldAlert, Loader2, Search, MoreHorizontal, CheckCircle2, XCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface User {
    _id: string;
    username: string;
    role: string;
    createdAt: string;
}

const UserManagement = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Create User State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Success Dialog State
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [createdUser, setCreatedUser] = useState('');

    // Delete User State
    const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);
    const [deletedUserName, setDeletedUserName] = useState('');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check access
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
        const userRole = localStorage.getItem('userRole');

        if (!isLoggedIn) {
            navigate('/admin/login');
        } else if (userRole !== 'superadmin') {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You do not have permission to manage users."
            });
            navigate('/admin/dashboard');
        } else {
            fetchUsers();
        }
    }, [navigate]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load users.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await api.post('/auth/create-user', {
                username: newUsername,
            });

            setCreatedUser(newUsername);
            setNewUsername('');
            setIsCreateDialogOpen(false);
            setShowSuccessDialog(true);
            fetchUsers();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to create user",
                description: error.response?.data?.message || "An error occurred.",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/auth/users/${userToDelete._id}`);

            setDeletedUserName(userToDelete.username);
            setUserToDelete(null);
            setShowDeleteSuccessDialog(true);
            fetchUsers();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to delete user",
                description: error.response?.data?.message || "An error occurred.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                                <p className="text-muted-foreground mt-1">Manage system administrators and access.</p>
                            </div>

                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="shadow-lg shadow-primary/20">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Create Admin
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New Administrator</DialogTitle>
                                        <DialogDescription>
                                            Add a new user with admin privileges. They will not have access to audit logs or user management.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username / Government ID</Label>
                                            <Input
                                                id="username"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                placeholder="e.g. ad_colombo_05"
                                                required
                                            />
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-sm flex gap-2 items-start">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">Default Password: 00000</p>
                                                <p className="text-xs opacity-90 mt-1">
                                                    The new admin will be required to change this password upon their first login.
                                                </p>
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-6">
                                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={isCreating}>
                                                {isCreating ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Create User'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>


                            {/* Success Dialog */}
                            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                                        </div>
                                        <DialogTitle className="text-center text-xl">User Created Successfully</DialogTitle>
                                        <DialogDescription className="text-center pt-2">
                                            Admin account <strong>{createdUser}</strong> has been created.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                        <div className="bg-muted p-4 rounded-lg text-center w-full">
                                            <p className="text-sm text-muted-foreground mb-1">Default Password</p>
                                            <p className="text-2xl font-mono font-bold tracking-wider">00000</p>
                                        </div>
                                        <p className="text-xs text-center text-muted-foreground max-w-[280px]">
                                            This temporary password must be changed upon first login.
                                        </p>
                                    </div>
                                    <DialogFooter className="sm:justify-center">
                                        <Button
                                            type="button"
                                            className="w-full sm:w-auto min-w-[120px]"
                                            onClick={() => setShowSuccessDialog(false)}
                                        >
                                            Done
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Delete Success Dialog */}
                            <Dialog open={showDeleteSuccessDialog} onOpenChange={setShowDeleteSuccessDialog}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                                            <Trash2 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <DialogTitle className="text-center text-xl">User Deleted</DialogTitle>
                                        <DialogDescription className="text-center pt-2">
                                            Admin account <strong>{deletedUserName}</strong> has been permanently removed.
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
                        </div>

                        <Card className="glass border-0 shadow-lg">
                            <CardHeader className="border-b border-border/40 pb-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users..."
                                            className="pl-9 h-9 bg-background/50"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ShieldAlert className="w-4 h-4 text-warning" />
                                        <span>Super Admin Area</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 text-center space-y-4">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="text-muted-foreground">Loading users...</p>
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-foreground">No users found</h3>
                                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                                            {searchQuery ? "No users match your search criteria." : "There are no other admin users in the system."}
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-muted/30 border-border/40">
                                                <TableHead>Username</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Created At</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((user) => (
                                                <TableRow key={user._id} className="hover:bg-muted/30 border-border/40">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                                {user.username.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            {user.username}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'} className="capitalize">
                                                            {user.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {user.role !== 'superadmin' && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => setUserToDelete(user)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete <strong>{user.username}</strong>? This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={handleDeleteUser}
                                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                        >
                                                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div >
        </MainLayout >
    );
};

export default UserManagement;
