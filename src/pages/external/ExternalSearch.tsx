import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, MapPin, Calendar, Hash, User, LogOut, Eye, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { DeedRecord } from '@/types';
import logo from '@/assets/logo.png';

const ExternalSearch = () => {
  const navigate = useNavigate();
  const [deeds, setDeeds] = useState<DeedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDeed, setSelectedDeed] = useState<DeedRecord | null>(null);
  const [userInfo, setUserInfo] = useState({ username: '', profession: '' });

  useEffect(() => {
    const username = localStorage.getItem('username') || '';
    const profession = localStorage.getItem('profession') || '';
    const userType = localStorage.getItem('userType');
    
    if (userType !== 'external') {
      navigate('/');
      return;
    }
    
    setUserInfo({ username, profession });
    fetchDeeds();
  }, [navigate]);

  const fetchDeeds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedDistrict !== 'All') params.append('district', selectedDistrict);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);

      const response = await api.get(`/deeds?${params.toString()}`);
      setDeeds(response.data);
    } catch (error) {
      console.error('Error fetching deeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeeds();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isExternalLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userType');
    localStorage.removeItem('username');
    localStorage.removeItem('profession');
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      valid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      invalid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const districts = [
    'All', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="E-Land System" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  E-Land Records
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  External Access Portal
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Scale className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  {userInfo.username}
                </span>
                <Badge variant="outline" className="capitalize">
                  {userInfo.profession}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Land Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Term</Label>
                  <Input
                    id="search"
                    placeholder="Deed number, title number, or NIC"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="invalid">Invalid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? 'Searching...' : 'Search Records'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Search Results ({deeds.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading records...</p>
              </div>
            ) : deeds.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No records found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deeds.map((deed) => (
                  <div
                    key={deed._id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="font-semibold text-lg">{deed.deedNumber}</h3>
                          <Badge className={getStatusBadge(deed.status)}>
                            {deed.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Title:</span>
                            <span>{deed.landTitleNumber}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Owner:</span>
                            <span>{deed.ownerName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Location:</span>
                            <span>{deed.landLocation}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">District:</span>
                            <span>{deed.district}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Registered:</span>
                            <span>{new Date(deed.registrationDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDeed(deed)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Land Record Details</DialogTitle>
                          </DialogHeader>
                          {selectedDeed && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Deed Number
                                  </Label>
                                  <p className="font-mono">{selectedDeed.deedNumber}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Land Title Number
                                  </Label>
                                  <p className="font-mono">{selectedDeed.landTitleNumber}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Owner Name
                                  </Label>
                                  <p>{selectedDeed.ownerName}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Owner NIC
                                  </Label>
                                  <p className="font-mono">{selectedDeed.ownerNIC}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Land Location
                                  </Label>
                                  <p>{selectedDeed.landLocation}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    District
                                  </Label>
                                  <p>{selectedDeed.district}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Province
                                  </Label>
                                  <p>{selectedDeed.province}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Land Area
                                  </Label>
                                  <p>{selectedDeed.landArea}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Survey Reference
                                  </Label>
                                  <p className="font-mono">{selectedDeed.surveyRef}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Registration Date
                                  </Label>
                                  <p>{new Date(selectedDeed.registrationDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Status
                                  </Label>
                                  <Badge className={getStatusBadge(selectedDeed.status)}>
                                    {selectedDeed.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Registered By
                                  </Label>
                                  <p>{selectedDeed.registeredBy}</p>
                                </div>
                              </div>
                              
                              {selectedDeed.blockchainHash && (
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Blockchain Hash
                                  </Label>
                                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                                    {selectedDeed.blockchainHash}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ExternalSearch;