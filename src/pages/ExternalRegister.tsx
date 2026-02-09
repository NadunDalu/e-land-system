import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, User, Key, Users, ArrowRight, Scale, MapPin, UserCheck, Mail } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/lib/api';
import logo from '@/assets/logo.png';

const ExternalRegister = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '+94',
    username: '',
    password: '',
    confirmPassword: '',
    profession: '',
    gender: '',
    province: '',
    district: ''
  });
  
  const [otp, setOtp] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const provinces = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern', 
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
  ];

  const districtsByProvince = {
    'Western': ['Colombo', 'Gampaha', 'Kalutara'],
    'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern': ['Galle', 'Matara', 'Hambantota'],
    'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
    'Eastern': ['Batticaloa', 'Ampara', 'Trincomalee'],
    'North Western': ['Kurunegala', 'Puttalam'],
    'North Central': ['Anuradhapura', 'Polonnaruwa'],
    'Uva': ['Badulla', 'Moneragala'],
    'Sabaragamuwa': ['Ratnapura', 'Kegalle']
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset district when province changes
      ...(field === 'province' ? { district: '' } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.username || 
        !formData.password || !formData.profession || !formData.gender || !formData.province || !formData.district) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Phone number validation
    const phoneRegex = /^\+94[0-9]{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Please enter a valid Sri Lankan phone number (+94xxxxxxxxx)');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register-external', {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        username: formData.username,
        password: formData.password,
        profession: formData.profession,
        gender: formData.gender,
        province: formData.province,
        district: formData.district
      });

      setRegistrationId(response.data.registrationId);
      setShowOtpVerification(true);
      setSuccess('Registration submitted! Please check your email for the OTP verification code.');

    } catch (err: any) {
      console.error('Registration Error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/verify-email', {
        registrationId,
        otp
      });

      setSuccess(response.data.message);
      setShowOtpVerification(false);
      
      // Clear form
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '+94',
        username: '',
        password: '',
        confirmPassword: '',
        profession: '',
        gender: '',
        province: '',
        district: ''
      });
      setOtp('');

    } catch (err: any) {
      console.error('OTP Verification Error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/resend-otp', { registrationId });
      setSuccess('OTP has been resent to your email address');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <img src={logo} alt="E-Land System" className="mx-auto h-16 w-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              External User Registration
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Register for access to land records verification
            </p>
          </div>

          {/* Registration Form */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
                  <Scale className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">Professional Registration</h3>
                <p className="text-sm text-muted-foreground">
                  For lawyers and notaries seeking land record access
                </p>
              </div>

              {success && !showOtpVerification && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <UserCheck className="w-5 h-5" />
                    <p className="font-medium">{success}</p>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    You will receive notification once your account is approved.
                  </p>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/external-login')}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      Go to Login
                    </Button>
                  </div>
                </div>
              )}

              {showOtpVerification && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Email Verification Required
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      We've sent a 6-digit OTP to your email address. Please enter it below to verify your email.
                    </p>
                    
                    <form onSubmit={handleOtpVerification} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP *</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="text-center text-lg tracking-widest"
                          maxLength={6}
                          required
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={loading || otp.length !== 6}
                          className="flex-1"
                        >
                          {loading ? 'Verifying...' : 'Verify Email'}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={handleResendOtp}
                          disabled={loading}
                        >
                          Resend OTP
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {!success && !showOtpVerification && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b pb-2">
                      Personal Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="+94771234567"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                              let value = e.target.value;
                              if (!value.startsWith('+94')) {
                                value = '+94' + value.replace(/^\+?94?/, '');
                              }
                              handleInputChange('phoneNumber', value);
                            }}
                            className="pl-10"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Sri Lankan phone number (+94xxxxxxxxx)</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profession">Professional Role *</Label>
                      <Select value={formData.profession} onValueChange={(value) => handleInputChange('profession', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your profession" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lawyer">Lawyer</SelectItem>
                          <SelectItem value="notary">Notary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b pb-2">
                      Location Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="province">Province *</Label>
                        <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district">District *</Label>
                        <Select 
                          value={formData.district} 
                          onValueChange={(value) => handleInputChange('district', value)}
                          disabled={!formData.province}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.province && districtsByProvince[formData.province as keyof typeof districtsByProvince]?.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white border-b pb-2">
                      Account Information
                    </h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    disabled={loading}
                  >
                    {loading ? (
                      'Submitting Registration...'
                    ) : (
                      <>
                        Submit Registration
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-6 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Note:</strong> Your registration will be reviewed by an administrator. 
                    You will be notified once your account is approved and you can access the system.
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account? {' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 hover:text-blue-700"
                      onClick={() => navigate('/external-login')}
                    >
                      Sign In
                    </Button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExternalRegister;