import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import Index from "./pages/Index";
import Verify from "./pages/Verify";
import About from "./pages/About";
import Login from "./pages/Login";
import ExternalLogin from "./pages/ExternalLogin";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import RegisterDeed from "./pages/admin/RegisterDeed";
import TransferOwnership from "./pages/admin/TransferOwnership";
import SearchDeeds from "./pages/admin/SearchDeeds";
import AuditLogs from "./pages/admin/AuditLogs";
import UserManagement from "./pages/admin/UserManagement";
import ChangePassword from "./pages/admin/ChangePassword";
import ExternalSearch from "./pages/external/ExternalSearch";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/layout/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/external-login" element={<ExternalLogin />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/register" element={<RegisterDeed />} />
            <Route path="/admin/transfer" element={<TransferOwnership />} />
            <Route path="/admin/search" element={<SearchDeeds />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/change-password" element={<ChangePassword />} />
            <Route path="/external/search" element={<ExternalSearch />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
