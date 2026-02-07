import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, XCircle, AlertCircle, Clock, Hash, ShieldCheck, FileText, MapPin, Ruler, User } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import { DeedRecord } from '@/types';
import api from '@/lib/api';

const Verify = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deedNumber, setDeedNumber] = useState(searchParams.get('deed') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<DeedRecord | null | 'not_found'>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const deedFromUrl = searchParams.get('deed');
    if (deedFromUrl) {
      handleSearch(deedFromUrl);
    }
  }, []);

  const handleSearch = async (searchDeed?: string) => {
    const searchValue = searchDeed || deedNumber;
    if (!searchValue.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setResult(null);

    try {
      // Use the general search endpoint which covers deedNumber and landTitleNumber
      const response = await api.get(`/deeds?search=${searchValue.trim()}`);

      if (response.data && response.data.length > 0) {
        // Try to find an exact match first
        const exactMatch = response.data.find((d: DeedRecord) =>
          d.deedNumber.toLowerCase() === searchValue.trim().toLowerCase() ||
          d.landTitleNumber.toLowerCase() === searchValue.trim().toLowerCase()
        );
        setResult(exactMatch || response.data[0]);
      } else {
        setResult('not_found');
      }
    } catch (error) {
      console.error('Error verifying deed:', error);
      setResult('not_found'); // Treat error as not found for now, or could show specific error
    } finally {
      setIsSearching(false);
    }

    setSearchParams({ deed: searchValue.trim() });
  };

  const handleNewSearch = () => {
    setResult(null);
    setHasSearched(false);
    setDeedNumber('');
    setSearchParams({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-gradient">{t.verify.title}</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.verify.subtitle}
            </p>
          </div>

          {/* Search Form */}
          {!hasSearched && (
            <Card className="glass overflow-hidden border-0 shadow-2xl skew-y-0 hover:skew-y-0 transition-transform duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">{t.verify.enterDeed}</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={t.verify.placeholder}
                      value={deedNumber}
                      onChange={(e) => setDeedNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-14 pl-12 text-lg bg-background/50 border-input/50 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    size="lg"
                    className="h-14 px-8 rounded-xl font-semibold shadow-lg hover:shadow-primary/25 transition-all w-full md:w-auto"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin mr-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                        {t.verify.searching}
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        {t.verify.button}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="text-center py-20">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <ShieldCheck className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-xl font-medium mb-2">{t.verify.searching}</h3>
              <p className="text-muted-foreground">Verifying deed records with central database...</p>
            </div>
          )}

          {/* Results */}
          {!isSearching && result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass overflow-hidden border-0 shadow-2xl">
                <div className={`h-2 w-full ${result === 'not_found' ? 'bg-destructive' :
                  result.status === 'valid' ? 'bg-success' : 'bg-warning'
                  }`}></div>

                <CardHeader className="border-b border-border/40 bg-muted/20 pb-8">
                  <div className="flex flex-col items-center text-center">
                    {result === 'not_found' ? (
                      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-10 h-10 text-destructive" />
                      </div>
                    ) : result.status === 'valid' ? (
                      <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-10 h-10 text-success" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-10 h-10 text-warning" />
                      </div>
                    )}

                    <CardTitle className="text-2xl mb-1">{t.verify.result.title}</CardTitle>
                    <p className="text-muted-foreground">
                      {result === 'not_found'
                        ? 'No records found matching the provided deed number'
                        : `Verification successful for Deed #${result.deedNumber}`
                      }
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  {result === 'not_found' ? (
                    <div className="text-center">
                      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 mb-8 max-w-md mx-auto">
                        <p className="font-medium text-destructive mb-2">{t.verify.result.notFound}</p>
                        <p className="text-sm text-foreground/70">
                          We couldn't find any record for deed number: <span className="font-mono font-bold">{deedNumber}</span>
                        </p>
                      </div>
                      <Button onClick={handleNewSearch} variant="outline" size="lg" className="rounded-full">
                        Try Another Search
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Status Badge */}
                      <div className="flex justify-center -mt-12 mb-8 relative z-10">
                        <span className={`px-6 py-2 rounded-full font-bold shadow-sm border flex items-center gap-2 ${result.status === 'valid'
                          ? 'bg-success text-success-foreground border-success/20'
                          : 'bg-warning text-warning-foreground border-warning/20'
                          }`}>
                          {result.status === 'valid' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {result.status === 'valid' ? t.verify.result.valid : 'Pending Verification'}
                        </span>
                      </div>

                      {/* Deed Details Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4" /> {t.verify.result.landTitleNumber}
                          </p>
                          <p className="font-semibold text-lg">{result.landTitleNumber}</p>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                            <User className="w-4 h-4" /> {t.verify.result.owner}
                          </p>
                          <p className="font-semibold text-lg">{result.ownerName}</p>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4" /> {t.verify.result.location}
                          </p>
                          <p className="font-semibold text-lg">{result.landLocation}</p>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                            <Ruler className="w-4 h-4" /> {t.verify.result.area}
                          </p>
                          <p className="font-semibold text-lg">{result.landArea}</p>
                        </div>
                      </div>

                      {/* Digital Verification */}
                      <div className="verification-stamp">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-success" />
                          </div>
                          <div>
                            <h4 className="font-bold text-success">{t.verify.result.verificationBadge}</h4>
                            <p className="text-xs text-muted-foreground">Cryptographically secured record</p>
                          </div>
                        </div>

                        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg border border-border/40 font-mono text-xs break-all text-muted-foreground">
                          {result.blockchainHash}
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Last Digital Verification:</span>
                          <span className="font-medium text-foreground">{formatDate(result.lastVerified)}</span>
                        </div>
                      </div>

                      {/* Privacy Note */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{t.verify.result.privacyNote}</p>
                      </div>

                      <div className="pt-4 text-center">
                        <Button onClick={handleNewSearch} variant="outline" className="rounded-full px-8 hover:bg-secondary transition-colors">
                          <Search className="w-4 h-4 mr-2" />
                          {t.verify.newSearch}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Verify;
