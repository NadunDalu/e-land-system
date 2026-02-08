import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const ChangePassword = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Ensure user is logged in but stuck in password change flow
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/admin/login');
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/change-password', { newPassword });

            toast({
                title: "Success",
                description: "Password changed successfully. You can now access the dashboard.",
            });

            // Update local storage to reflect that password change is done (though typically this flag comes from DB on login)
            // We can just redirect to dashboard now
            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="flex-1 flex flex-col justify-center items-center py-12 px-4">
                <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                    <Card className="glass overflow-hidden border-0 shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-orange-500 to-destructive"></div>
                        <CardHeader className="text-center pt-8">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl">Change Default Password</CardTitle>
                            <CardDescription>
                                For security reasons, you must change your default password before proceeding.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-10"
                                            required
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10"
                                            required
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Updating...' : 'Update Password & Continue'}
                                    {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default ChangePassword;
