import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FilePlus, ArrowRightLeft, Search, FileText, LogOut, Users, Settings
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from 'react';

interface SidebarProps {
    className?: string;
    mobile?: boolean;
}

const Sidebar = ({ className = "", mobile = false }: SidebarProps) => {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        setRole(userRole);
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('isAdminLoggedIn');
            localStorage.removeItem('userRole');
            navigate('/');
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: t.dashboard.menu.overview, path: '/admin/dashboard', roles: ['superadmin', 'admin'] },
        { icon: FilePlus, label: t.dashboard.menu.registerDeed, path: '/admin/register', roles: ['superadmin', 'admin'] },
        { icon: ArrowRightLeft, label: t.dashboard.menu.transferDeed, path: '/admin/transfer', roles: ['superadmin', 'admin'] },
        { icon: Search, label: t.dashboard.menu.searchDeeds, path: '/admin/search', roles: ['superadmin', 'admin'] },
        { icon: FileText, label: t.dashboard.menu.auditLogs, path: '/admin/audit', roles: ['superadmin'] },
        { icon: Users, label: 'User Management', path: '/admin/users', roles: ['superadmin'] },
    ];

    const filteredItems = menuItems.filter(item => !role || item.roles.includes(role));

    if (mobile) {
        return (
            <div className={`glass-card rounded-xl p-4 flex overflow-x-auto gap-4 scrollbar-hide ${className}`}>
                {filteredItems.map((item) => (
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
        );
    }

    return (
        <aside className={`lg:w-72 flex-shrink-0 space-y-8 ${className}`}>
            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary hidden lg:block">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-xl text-primary">AD</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Admin Portal</h3>
                        <p className="text-xs text-muted-foreground capitalize">{role || 'Government Officer'}</p>
                    </div>
                </div>
                <div className="space-y-1">
                    {filteredItems.map((item) => (
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
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 w-full transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">{t.nav.logout}</span>
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t.dashboard.logoutConfirm.title}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t.dashboard.logoutConfirm.message}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t.dashboard.logoutConfirm.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {t.dashboard.logoutConfirm.confirm}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
