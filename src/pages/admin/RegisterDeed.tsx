import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ArrowRightLeft, Search, FileText, LogOut,
  Upload, Hash, CheckCircle2, Loader2, FileCheck
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/components/layout/MainLayout';
import Sidebar from '@/components/layout/Sidebar';
import { generateHash } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

const RegisterDeed = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    landTitleNumber: '',
    deedNumber: '',
    landLocation: '',
    district: '',
    province: '',
    surveyRef: '',
    ownerName: '',
    ownerNIC: '',
    landArea: '',
  });

  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Logout logic removed, handled in Sidebar

  // Menu items removed, handled in Sidebar

  const provinces = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern',
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
  ];

  const districts: Record<string, string[]> = {
    'Western': ['Colombo', 'Gampaha', 'Kalutara'],
    'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern': ['Galle', 'Matara', 'Hambantota'],
    'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
    'Eastern': ['Ampara', 'Batticaloa', 'Trincomalee'],
    'North Western': ['Kurunegala', 'Puttalam'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'],
    'Uva': ['Badulla', 'Monaragala'],
    'Sabaragamuwa': ['Ratnapura', 'Kegalle'],
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (generatedHash) {
      setGeneratedHash(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  const handleGenerateHash = async () => {
    setIsGenerating(true);
    // Simulate hash generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const dataString = JSON.stringify(formData);
    const hash = generateHash(dataString);
    setGeneratedHash(hash);
    setIsGenerating(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Append all text fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      // Append hash and file
      if (generatedHash) submitData.append('blockchainHash', generatedHash);
      if (uploadedFile) submitData.append('document', uploadedFile);

      await api.post('/deeds', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: t.common.success,
        description: t.register.success,
      });

      // Reset form
      setFormData({
        landTitleNumber: '',
        deedNumber: '',
        landLocation: '',
        district: '',
        province: '',
        surveyRef: '',
        ownerName: '',
        ownerNIC: '',
        landArea: '',
      });
      setGeneratedHash(null);
      setUploadedFile(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.response?.data?.message || "Could not register deed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== '');

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
            <h1 className="text-3xl font-bold tracking-tight mb-6">{t.register.title}</h1>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Registration Form */}
              <div className="lg:col-span-2">
                <Card className="glass border-0 shadow-lg h-full">
                  <CardHeader className="border-b border-border/40 bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FilePlus className="w-5 h-5 text-primary" />
                      Deed Information
                    </CardTitle>
                    <CardDescription>
                      Enter official deed details to register in the immutable ledger
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="landTitleNumber">{t.register.landTitleNumber} <span className="text-destructive">*</span></Label>
                        <Input
                          id="landTitleNumber"
                          placeholder="LT/WP/COL/2024/00000"
                          value={formData.landTitleNumber}
                          onChange={(e) => handleInputChange('landTitleNumber', e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deedNumber">{t.register.deedNumber} <span className="text-destructive">*</span></Label>
                        <Input
                          id="deedNumber"
                          placeholder="LR/2024/COL/00000"
                          value={formData.deedNumber}
                          onChange={(e) => handleInputChange('deedNumber', e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="surveyRef">{t.register.surveyRef} <span className="text-destructive">*</span></Label>
                      <Input
                        id="surveyRef"
                        placeholder="SV/2024/COL/0000"
                        value={formData.surveyRef}
                        onChange={(e) => handleInputChange('surveyRef', e.target.value)}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="province">Province <span className="text-destructive">*</span></Label>
                        <Select
                          value={formData.province}
                          onValueChange={(value) => {
                            handleInputChange('province', value);
                            handleInputChange('district', '');
                          }}
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select Province" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map(province => (
                              <SelectItem key={province} value={province}>{province}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
                        <Select
                          value={formData.district}
                          onValueChange={(value) => handleInputChange('district', value)}
                          disabled={!formData.province}
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.province && districts[formData.province]?.map(district => (
                              <SelectItem key={district} value={district}>{district}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landLocation">{t.register.landLocation} <span className="text-destructive">*</span></Label>
                      <Textarea
                        id="landLocation"
                        placeholder="Full address of the land"
                        value={formData.landLocation}
                        onChange={(e) => handleInputChange('landLocation', e.target.value)}
                        rows={3}
                        className="bg-background/50 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landArea">{t.register.landArea} <span className="text-destructive">*</span></Label>
                      <Input
                        id="landArea"
                        placeholder="e.g., 15.5 perches"
                        value={formData.landArea}
                        onChange={(e) => handleInputChange('landArea', e.target.value)}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4">
                      <h3 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                        <FileCheck className="w-4 h-4" /> Owner Information
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ownerName">{t.register.ownerName} <span className="text-destructive">*</span></Label>
                          <Input
                            id="ownerName"
                            placeholder="Full legal name"
                            value={formData.ownerName}
                            onChange={(e) => handleInputChange('ownerName', e.target.value)}
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ownerNIC">{t.register.ownerNIC} <span className="text-destructive">*</span></Label>
                          <Input
                            id="ownerNIC"
                            placeholder="NIC Number"
                            value={formData.ownerNIC}
                            onChange={(e) => handleInputChange('ownerNIC', e.target.value)}
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="document">{t.register.uploadDoc}</Label>
                      <div className="mt-2 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-muted/5 group cursor-pointer relative">
                        <input
                          type="file"
                          id="document"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          {uploadedFile ? (
                            <span className="text-primary font-medium">{uploadedFile.name}</span>
                          ) : (
                            <>
                              <span className="font-medium text-foreground">Click to upload PDF document</span>
                              <span className="text-xs text-muted-foreground">PDF files up to 10MB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hash Generation & Submission */}
              <div className="space-y-6">
                <Card className="glass border-0 shadow-lg sticky top-24">
                  <CardHeader className="border-b border-border/40 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Hash className="w-5 h-5 text-primary" />
                      Verification
                    </CardTitle>
                    <CardDescription>
                      Generate cryptographic signature
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <Button
                        onClick={handleGenerateHash}
                        disabled={!isFormValid || isGenerating}
                        className="w-full h-12"
                        variant="outline"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Hash className="w-4 h-4 mr-2" />
                            {t.register.generateHash}
                          </>
                        )}
                      </Button>

                      {generatedHash && (
                        <div className="p-4 bg-muted/50 rounded-lg border border-border/50 animate-in fade-in slide-in-from-top-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-success" /> {t.register.hashGenerated}
                          </p>
                          <code className="text-xs break-all text-primary font-mono bg-background p-2 rounded block">
                            {generatedHash}
                          </code>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border/40 pt-6">
                      <Button
                        onClick={handleSubmit}
                        disabled={!generatedHash || isSubmitting}
                        className="w-full h-12 shadow-lg shadow-primary/20"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {t.register.submit}
                          </>
                        )}
                      </Button>

                      {!generatedHash && (
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          Generate hash to enable submission
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterDeed;
