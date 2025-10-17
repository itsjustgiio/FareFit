import { useState } from 'react';
import { ArrowLeft, User, Apple, Dumbbell, MessageCircle, Lock, Download, Trash2, Shield, Eye, Mail, Camera, Mic, AlertTriangle } from 'lucide-react';
import { Footer } from './Footer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './ui/alert-dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface PrivacyPageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
}

export function PrivacyPage({ onBack, onNavigate, onFeedbackClick }: PrivacyPageProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  
  // Privacy settings state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  
  // Permissions state
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const handleDeleteAccount = () => {
    // Here you would make the API call to delete the account
    console.log('Account deletion requested');
    setDeleteDialogOpen(false);
    // Show success message or redirect
  };

  const handleDownloadData = () => {
    // Simulate CSV download
    const csvData = `Date,Meal,Calories,Protein,Carbs,Fat
2025-10-16,Breakfast Oats,450,15,65,12
2025-10-16,Grilled Chicken Salad,520,45,35,18
2025-10-16,Protein Shake,280,30,25,5`;
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fitpanel-data-export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setDownloadDialogOpen(false);
  };
  const dataCollected = [
    {
      icon: User,
      title: 'Account Info',
      description: 'Name, email, and login credentials'
    },
    {
      icon: Apple,
      title: 'Nutrition Data',
      description: 'Meals, macros, and preferences you log'
    },
    {
      icon: Dumbbell,
      title: 'Fitness Activity',
      description: 'Workouts, progress scores, consistency stats'
    },
    {
      icon: MessageCircle,
      title: 'Feedback & App Usage',
      description: 'For improving features'
    }
  ];

  const whyWeCollect = [
    { type: 'Meals & workouts', reason: 'To personalize your AI recommendations' },
    { type: 'Fitness Score', reason: 'To track your consistency and progress' },
    { type: 'Feedback', reason: 'To improve FareFit features' },
    { type: 'Account info', reason: 'To secure your account and sync data' }
  ];

  const userControls = [
    { icon: Trash2, title: 'Delete account or clear history anytime', action: 'Delete Account' },
    { icon: Eye, title: 'Disable analytics tracking', action: 'Manage Privacy' },
    { icon: Download, title: 'Export your data as a .csv', action: 'Download My Info' },
    { icon: Shield, title: 'Manage permissions (camera, microphone, etc.)', action: 'Manage Permissions' }
  ];

  const securityFeatures = [
    'All data encrypted in transit & storage',
    'Secure JWT authentication',
    'Passwords hashed with bcrypt',
    'API calls protected via HTTPS'
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8F4F2' }}>
      {/* Header */}
      <div className="bg-white shadow-sm" style={{ borderBottom: '1px solid #A8E6CF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: '#102A43' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Title Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Lock className="w-8 h-8" style={{ color: '#1C7C54' }} />
            <h1 style={{ color: '#102A43' }}>Your Privacy, Our Priority</h1>
          </div>
          <p className="text-lg mb-4" style={{ color: '#102A43', opacity: 0.8 }}>
            We take your data seriously. FitPanel only collects what's needed to give you accurate insights — and you control it all.
          </p>
          <div 
            className="inline-block px-6 py-3 rounded-lg text-sm"
            style={{ backgroundColor: '#1C7C5420', color: '#1C7C54' }}
          >
            💚 We built FareFit with transparency first — no hidden tracking, no data selling.
          </div>
        </div>

        {/* What We Collect */}
        <div className="mb-10">
          <h2 className="mb-6" style={{ color: '#102A43' }}>What We Collect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataCollected.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <item.icon className="w-6 h-6" style={{ color: '#1C7C54' }} />
                </div>
                <h3 className="mb-2" style={{ color: '#102A43' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why We Collect It */}
        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="mb-6" style={{ color: '#102A43' }}>Why We Collect It</h2>
          <div className="space-y-4">
            {whyWeCollect.map((item, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center py-3 border-b last:border-b-0"
                style={{ borderColor: '#E8F4F2' }}
              >
                <span style={{ color: '#102A43' }}>{item.type}</span>
                <span className="text-sm text-right max-w-xs" style={{ color: '#1C7C54' }}>
                  {item.reason}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Who Sees Your Data */}
        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="mb-6" style={{ color: '#102A43' }}>Who Sees Your Data</h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <User className="w-8 h-8" style={{ color: '#1C7C54' }} />
                </div>
                <span className="text-sm" style={{ color: '#102A43' }}>You</span>
              </div>
              
              <div className="flex-1 h-0.5" style={{ backgroundColor: '#A8E6CF' }}></div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <Lock className="w-8 h-8" style={{ color: '#1C7C54' }} />
                </div>
                <span className="text-sm" style={{ color: '#102A43' }}>FareFit</span>
                <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Secure Storage</p>
              </div>
              
              <div className="flex-1 h-0.5" style={{ backgroundColor: '#A8E6CF' }}></div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <Shield className="w-8 h-8" style={{ color: '#1C7C54' }} />
                </div>
                <span className="text-sm" style={{ color: '#102A43' }}>AI Insights</span>
                <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Aggregated Only</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-lg">✅</div>
              <p className="text-sm" style={{ color: '#102A43' }}>
                <strong>Only you</strong> — and the AI models working locally or via secure APIs
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-lg">❌</div>
              <p className="text-sm" style={{ color: '#102A43' }}>
                <strong>We never sell your data</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-lg">❌</div>
              <p className="text-sm" style={{ color: '#102A43' }}>
                <strong>We don't share it with advertisers</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-lg">📊</div>
              <p className="text-sm" style={{ color: '#102A43' }}>
                Any analytics are <strong>aggregated and anonymous</strong> (used to understand app performance, not your habits)
              </p>
            </div>
          </div>
        </div>

        {/* Your Controls */}
        <div className="mb-10">
          <h2 className="mb-6" style={{ color: '#102A43' }}>Your Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delete Account */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <Trash2 className="w-5 h-5" style={{ color: '#1C7C54' }} />
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: '#102A43' }}>
                Delete account or clear history anytime
              </p>
              <button 
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full px-4 py-2 rounded-md border transition-all hover:bg-gray-50"
                style={{ borderColor: '#A8E6CF', color: '#102A43' }}
              >
                Delete Account
              </button>
            </div>

            {/* Manage Privacy */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <Eye className="w-5 h-5" style={{ color: '#1C7C54' }} />
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: '#102A43' }}>
                Disable analytics tracking
              </p>
              <button 
                onClick={() => setPrivacyDialogOpen(true)}
                className="w-full px-4 py-2 rounded-md border transition-all hover:bg-gray-50"
                style={{ borderColor: '#A8E6CF', color: '#102A43' }}
              >
                Manage Privacy
              </button>
            </div>

            {/* Download Data */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <Download className="w-5 h-5" style={{ color: '#1C7C54' }} />
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: '#102A43' }}>
                Export your data as a .csv
              </p>
              <button 
                onClick={() => setDownloadDialogOpen(true)}
                className="w-full px-4 py-2 rounded-md border transition-all hover:bg-gray-50"
                style={{ borderColor: '#A8E6CF', color: '#102A43' }}
              >
                Download My Info
              </button>
            </div>

            {/* Manage Permissions */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <Shield className="w-5 h-5" style={{ color: '#1C7C54' }} />
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: '#102A43' }}>
                Manage permissions (camera, microphone, etc.)
              </p>
              <button 
                onClick={() => setPermissionsDialogOpen(true)}
                className="w-full px-4 py-2 rounded-md border transition-all hover:bg-gray-50"
                style={{ borderColor: '#A8E6CF', color: '#102A43' }}
              >
                Manage Permissions
              </button>
            </div>
          </div>
        </div>

        {/* How We Protect Your Data */}
        <div 
          className="rounded-lg p-6 sm:p-8 shadow-sm mb-10"
          style={{ backgroundColor: '#102A4308', border: '1px solid #1C7C5430' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6" style={{ color: '#1C7C54' }} />
            <h2 className="m-0" style={{ color: '#102A43' }}>How We Protect Your Data</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="text-lg">🔐</div>
                <p className="text-sm" style={{ color: '#102A43' }}>{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Transparency */}
        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#1C7C5420' }}
            >
              <span className="text-xl">🤖</span>
            </div>
            <h2 className="m-0" style={{ color: '#102A43' }}>About AI in FareFit</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-lg flex-shrink-0">💬</div>
              <p className="text-sm" style={{ color: '#102A43' }}>
                AI suggestions (Food AI, Coach AI) use your data to generate insights but <strong>never store your conversations permanently</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-lg flex-shrink-0">🔒</div>
              <p className="text-sm" style={{ color: '#102A43' }}>
                <strong>No data is shared with external models</strong> without your consent
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-lg flex-shrink-0">🧹</div>
              <p className="text-sm" style={{ color: '#102A43' }}>
                You can <strong>clear AI history at any time</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Updates */}
        <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm text-center">
          <h3 className="mb-4" style={{ color: '#102A43' }}>Have questions about your privacy?</h3>
          <div className="flex flex-col items-center gap-4">
            <a 
              href="mailto:privacy@fitpanel.ai"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1C7C54' }}
            >
              <Mail className="w-5 h-5" />
              <span>privacy@fitpanel.ai</span>
            </a>
            <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
              🔄 We update this page if anything changes — last updated: <strong>October 2025</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Delete Account Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FFB6B920' }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: '#FFB6B9' }} />
              </div>
              <AlertDialogTitle style={{ color: '#102A43' }}>Delete Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div style={{ color: '#102A43', opacity: 0.8 }}>
                <div className="mb-3">
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                </div>
                <ul className="space-y-1 list-disc list-inside mb-3">
                  <li>All logged meals and nutrition data</li>
                  <li>Workout history and progress</li>
                  <li>Fitness Credit Score history</li>
                  <li>AI conversation history</li>
                </ul>
                <div>
                  Are you absolutely sure you want to delete your account?
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderColor: '#A8E6CF' }}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              style={{ backgroundColor: '#FFB6B9', color: '#102A43' }}
            >
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Privacy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: '#102A43' }}>Privacy Settings</DialogTitle>
            <DialogDescription style={{ color: '#102A43', opacity: 0.7 }}>
              Control what data we collect to improve FareFit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="analytics" style={{ color: '#102A43' }}>Analytics Tracking</Label>
                <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.6 }}>
                  Help us improve by sharing anonymous usage data
                </p>
              </div>
              <Switch 
                id="analytics"
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
                style={{ 
                  backgroundColor: analyticsEnabled ? '#1C7C54' : undefined
                } as any}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="crashes" style={{ color: '#102A43' }}>Crash Reports</Label>
                <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.6 }}>
                  Automatically send crash reports to fix bugs
                </p>
              </div>
              <Switch 
                id="crashes"
                checked={crashReportsEnabled}
                onCheckedChange={setCrashReportsEnabled}
                style={{ 
                  backgroundColor: crashReportsEnabled ? '#1C7C54' : undefined
                } as any}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="marketing" style={{ color: '#102A43' }}>Marketing Emails</Label>
                <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.6 }}>
                  Receive tips, updates, and feature announcements
                </p>
              </div>
              <Switch 
                id="marketing"
                checked={marketingEnabled}
                onCheckedChange={setMarketingEnabled}
                style={{ 
                  backgroundColor: marketingEnabled ? '#1C7C54' : undefined
                } as any}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E8F4F2' }}>
            <button
              onClick={() => setPrivacyDialogOpen(false)}
              className="px-6 py-2 rounded-md border transition-all hover:bg-gray-50"
              style={{ borderColor: '#A8E6CF', color: '#102A43' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Save settings here
                console.log('Privacy settings saved:', { analyticsEnabled, crashReportsEnabled, marketingEnabled });
                setPrivacyDialogOpen(false);
              }}
              className="px-6 py-2 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1C7C54' }}
            >
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Data Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: '#102A43' }}>Download Your Data</DialogTitle>
            <DialogDescription style={{ color: '#102A43', opacity: 0.7 }}>
              Export a complete copy of your FitPanel data
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm mb-4" style={{ color: '#102A43' }}>
              Your export will include:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm" style={{ color: '#102A43' }}>
                <Apple className="w-4 h-4" style={{ color: '#1C7C54' }} />
                All logged meals and nutrition data
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: '#102A43' }}>
                <Dumbbell className="w-4 h-4" style={{ color: '#1C7C54' }} />
                Workout history and calories burned
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: '#102A43' }}>
                <Shield className="w-4 h-4" style={{ color: '#1C7C54' }} />
                Fitness Credit Score timeline
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: '#102A43' }}>
                <User className="w-4 h-4" style={{ color: '#1C7C54' }} />
                Account information
              </li>
            </ul>
            <div 
              className="p-4 rounded-lg mb-6"
              style={{ backgroundColor: '#1C7C5410', border: '1px solid #1C7C5430' }}
            >
              <p className="text-xs" style={{ color: '#1C7C54' }}>
                📄 Format: CSV (Comma-Separated Values)<br />
                💾 Size: ~2-5 KB<br />
                ⚡ Ready in seconds
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E8F4F2' }}>
            <button
              onClick={() => setDownloadDialogOpen(false)}
              className="px-6 py-2 rounded-md border transition-all hover:bg-gray-50"
              style={{ borderColor: '#A8E6CF', color: '#102A43' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadData}
              className="px-6 py-2 rounded-md text-white transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: '#1C7C54' }}
            >
              <Download className="w-4 h-4" />
              Download Now
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: '#102A43' }}>App Permissions</DialogTitle>
            <DialogDescription style={{ color: '#102A43', opacity: 0.7 }}>
              Control what FareFit can access on your device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Camera className="w-5 h-5 mt-0.5" style={{ color: '#1C7C54' }} />
                <div className="flex-1">
                  <Label htmlFor="camera" style={{ color: '#102A43' }}>Camera</Label>
                  <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    For scanning barcodes and food photos
                  </p>
                </div>
              </div>
              <Switch 
                id="camera"
                checked={cameraEnabled}
                onCheckedChange={setCameraEnabled}
                style={{ 
                  backgroundColor: cameraEnabled ? '#1C7C54' : undefined
                } as any}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Mic className="w-5 h-5 mt-0.5" style={{ color: '#1C7C54' }} />
                <div className="flex-1">
                  <Label htmlFor="microphone" style={{ color: '#102A43' }}>Microphone</Label>
                  <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    For voice commands (future feature)
                  </p>
                </div>
              </div>
              <Switch 
                id="microphone"
                checked={microphoneEnabled}
                onCheckedChange={setMicrophoneEnabled}
                style={{ 
                  backgroundColor: microphoneEnabled ? '#1C7C54' : undefined
                } as any}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <MessageCircle className="w-5 h-5 mt-0.5" style={{ color: '#1C7C54' }} />
                <div className="flex-1">
                  <Label htmlFor="notifications" style={{ color: '#102A43' }}>Notifications</Label>
                  <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    Reminders for meals and workouts
                  </p>
                </div>
              </div>
              <Switch 
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                style={{ 
                  backgroundColor: notificationsEnabled ? '#1C7C54' : undefined
                } as any}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-5 h-5 mt-0.5 text-center">📍</div>
                <div className="flex-1">
                  <Label htmlFor="location" style={{ color: '#102A43' }}>Location</Label>
                  <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    Find nearby gyms and restaurants
                  </p>
                </div>
              </div>
              <Switch 
                id="location"
                checked={locationEnabled}
                onCheckedChange={setLocationEnabled}
                style={{ 
                  backgroundColor: locationEnabled ? '#1C7C54' : undefined
                } as any}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E8F4F2' }}>
            <button
              onClick={() => setPermissionsDialogOpen(false)}
              className="px-6 py-2 rounded-md border transition-all hover:bg-gray-50"
              style={{ borderColor: '#A8E6CF', color: '#102A43' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Save permission settings here
                console.log('Permissions saved:', { cameraEnabled, microphoneEnabled, notificationsEnabled, locationEnabled });
                setPermissionsDialogOpen(false);
              }}
              className="px-6 py-2 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1C7C54' }}
            >
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer 
        onNavigate={onNavigate}
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
}