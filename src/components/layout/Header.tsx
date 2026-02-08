import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '@/assets/logo.png';

const Header = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Check if current path is an admin page (but not the login page)
  const isAdminPage = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  const navLinks = [
    { path: '/', label: t.nav.home },
    { path: '/verify', label: t.nav.verifyDeed },
    { path: '/about', label: t.nav.about },
    { path: '/admin/login', label: 'Admin Login' },
    { path: '/external-login', label: 'External Login' },
  ];

  return (
    <header className="govt-header sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo and Title */}
          {/* Logo and Title */}
          {isAdminPage ? (
            <div className="flex items-center gap-3 cursor-default">
              <img src={logo} alt="Sri Lanka Land Registry Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-sm md:text-base font-semibold leading-tight text-foreground">
                  {t.systemTitle}
                </h1>
                <p className="text-xs text-[#2D5EEA]/80">{t.country}</p>
              </div>
            </div>
          ) : (
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Sri Lanka Land Registry Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-sm md:text-base font-semibold leading-tight text-foreground">
                  {t.systemTitle}
                </h1>
                <p className="text-xs text-[#2D5EEA]/80">{t.country}</p>
              </div>
            </Link>
          )}

          {/* Desktop Navigation - Hidden on admin pages */}
          {!isAdminPage && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.path)
                    ? 'bg-[#2D5EEA]/10 text-[#2D5EEA]'
                    : 'text-[#2D5EEA]/80 hover:bg-[#2D5EEA]/5 hover:text-[#2D5EEA]'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="ml-4 border-l border-[#2D5EEA]/20 pl-4">
                <LanguageSwitcher />
              </div>
            </nav>
          )}

          {/* Language Switcher only on admin pages */}
          {isAdminPage && (
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
          )}

          {/* Mobile Menu Button - Hidden on admin pages */}
          {!isAdminPage && (
            <div className="flex items-center gap-2 lg:hidden">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#2D5EEA] hover:bg-[#2D5EEA]/10"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          )}

          {/* Language Switcher for mobile on admin pages */}
          {isAdminPage && (
            <div className="lg:hidden">
              <LanguageSwitcher />
            </div>
          )}
        </div>

        {/* Mobile Navigation - Hidden on admin pages */}
        {!isAdminPage && mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-[#2D5EEA]/20">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive(link.path)
                  ? 'bg-[#2D5EEA]/10 text-[#2D5EEA]'
                  : 'text-[#2D5EEA]/80 hover:bg-[#2D5EEA]/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

