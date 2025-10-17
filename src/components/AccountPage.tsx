import { useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, TrendingUp, Award, Calendar, Users, Trophy, Heart, Settings, Edit2, Share2, Check, Copy, X, UserPlus, Bell, Lock, Ruler, Trash2, Camera, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { getThemeColors } from '../utils/themeColors';

interface AccountPageProps {
  onBack: () => void;
  userName: string;
  userEmail: string;
  isDemoMode?: boolean;
  onUpdateProfile?: (name: string, email: string, avatar: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

interface FareScoreData {
  score: number;
  change: number; // Change from last week
  tier: 'Starting Journey' | 'Building Habits' | 'Consistent Tracker' | 'Goal Crusher' | 'FareFit Elite';
  history: { date: string; score: number }[];
  mealsLogged: number;
  workoutsCompleted: number;
  streakDays: number;
  penalties: number;
  joinDate: string;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  fareScore: number;
  tier: string;
  change: number;
  streakDays: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  avatar: string;
  fareScore: number;
  tier: string;
  change: number;
  isCurrentUser?: boolean;
}

export function AccountPage({ onBack, userName, userEmail, isDemoMode = false, onUpdateProfile, isDarkMode = false, onToggleDarkMode }: AccountPageProps) {
  const colors = getThemeColors(isDarkMode);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [cheeredFriends, setCheeredFriends] = useState<Set<string>>(new Set());
  
  // Edit profile form state - Use localStorage as source of truth, fallback to props
  const [editName, setEditName] = useState(() => {
    return localStorage.getItem('farefit_user_name') || userName;
  });
  const [editEmail, setEditEmail] = useState(() => {
    return localStorage.getItem('farefit_user_email') || userEmail;
  });
  const [profileAvatar, setProfileAvatar] = useState(() => {
    return localStorage.getItem('farefit_user_avatar') || '';
  });
  const [previewAvatar, setPreviewAvatar] = useState(profileAvatar);
  
  // Add friend form state
  const [friendUsername, setFriendUsername] = useState('');

  // Settings state - Load from localStorage
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('farefit_notifications');
    return saved ? JSON.parse(saved) : true;
  });
  const [privacySetting, setPrivacySetting] = useState<'public' | 'friends' | 'private'>(() => {
    const saved = localStorage.getItem('farefit_privacy');
    return (saved as 'public' | 'friends' | 'private') || 'public';
  });
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>(() => {
    const saved = localStorage.getItem('farefit_units');
    return (saved as 'metric' | 'imperial') || 'metric';
  });

  // Demo FareScore data
  const fareScoreData: FareScoreData = {
    score: 615,
    change: 8,
    tier: 'Consistent Tracker',
    history: [
      { date: 'Sep 17', score: 550 },
      { date: 'Sep 24', score: 565 },
      { date: 'Oct 1', score: 582 },
      { date: 'Oct 8', score: 595 },
      { date: 'Oct 15', score: 607 },
      { date: 'Oct 17', score: 615 },
    ],
    mealsLogged: 27,
    workoutsCompleted: 11,
    streakDays: 14,
    penalties: 2,
    joinDate: 'August 15, 2025',
  };

  // Demo friends data
  const friends: Friend[] = [
    {
      id: '1',
      name: 'Julia Martinez',
      username: '@fitjules',
      avatar: '',
      fareScore: 842,
      tier: 'FareFit Elite',
      change: 6,
      streakDays: 45,
    },
    {
      id: '2',
      name: 'Mike Chen',
      username: '@mike_gains',
      avatar: '',
      fareScore: 720,
      tier: 'Goal Crusher',
      change: -3,
      streakDays: 21,
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      username: '@sarahfit',
      avatar: '',
      fareScore: 598,
      tier: 'Consistent Tracker',
      change: 12,
      streakDays: 9,
    },
  ];

  // Demo leaderboard data
  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, name: 'Julia Martinez', username: '@fitjules', avatar: '', fareScore: 842, tier: 'FareFit Elite', change: 6 },
    { rank: 2, name: 'Giovanni Rossi', username: '@gio_fit', avatar: '', fareScore: 830, tier: 'FareFit Elite', change: 4 },
    { rank: 3, name: 'Alex Thompson', username: '@alexmacros', avatar: '', fareScore: 799, tier: 'Goal Crusher', change: 8 },
    { rank: 4, name: 'Emma Davis', username: '@emmahealth', avatar: '', fareScore: 785, tier: 'Goal Crusher', change: 2 },
    { rank: 5, name: 'Ryan Park', username: '@ryanfit', avatar: '', fareScore: 762, tier: 'Goal Crusher', change: -1 },
    { rank: 18, name: userName, username: '@you', avatar: '', fareScore: 615, tier: 'Consistent Tracker', change: 8, isCurrentUser: true },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FareFit Elite':
        return '#4DD4AC';
      case 'Goal Crusher':
        return '#1C7C54';
      case 'Consistent Tracker':
        return '#A8E6CF';
      case 'Building Habits':
        return '#F5A623';
      case 'Starting Journey':
        return '#E53E3E';
      default:
        return '#102A43';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return '#4DD4AC';
    if (score >= 700) return '#1C7C54';
    if (score >= 550) return '#A8E6CF';
    if (score >= 400) return '#F5A623';
    return '#E53E3E';
  };

  const getScorePercentage = (score: number) => {
    return ((score - 300) / (850 - 300)) * 100;
  };

  // Handler functions
  const handleEditProfile = () => {
    // Validation
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (!editEmail.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Save to localStorage
    localStorage.setItem('farefit_user_name', editName);
    localStorage.setItem('farefit_user_email', editEmail);
    localStorage.setItem('farefit_user_avatar', previewAvatar);
    
    // Update parent component if callback provided
    if (onUpdateProfile) {
      onUpdateProfile(editName, editEmail, previewAvatar);
    }
    
    setProfileAvatar(previewAvatar);
    toast.success('Profile updated successfully!');
    setIsEditProfileOpen(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar('');
    toast.info('Avatar removed');
  };

  const handleShare = () => {
    const shareUrl = `https://farefit.app/score/${userName.toLowerCase().replace(/\s+/g, '')}`;
    navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleAddFriend = () => {
    if (!friendUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    // In production, this would send a friend request to the backend
    toast.success(`Friend request sent to ${friendUsername}!`);
    setFriendUsername('');
    setIsAddFriendOpen(false);
  };

  const handleCheer = (friendId: string, friendName: string) => {
    if (cheeredFriends.has(friendId)) {
      toast.info(`You already cheered for ${friendName} today!`);
      return;
    }
    // In production, this would send a cheer notification to the backend
    setCheeredFriends(prev => new Set(prev).add(friendId));
    toast.success(`You cheered for ${friendName}! 🎉`);
  };

  const handleNotificationToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem('farefit_notifications', JSON.stringify(checked));
    toast.success(checked ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handlePrivacyChange = (value: 'public' | 'friends' | 'private') => {
    setPrivacySetting(value);
    localStorage.setItem('farefit_privacy', value);
    const messages = {
      public: 'Your profile is now public',
      friends: 'Your profile is now visible to friends only',
      private: 'Your profile is now private'
    };
    toast.success(messages[value]);
  };

  const handleUnitsChange = (value: 'metric' | 'imperial') => {
    setUnitPreference(value);
    localStorage.setItem('farefit_units', value);
    toast.success(`Units changed to ${value === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, inches)'}`);
  };

  const handleDeleteAccount = () => {
    // In production, this would delete the account from the backend
    toast.error('Account deletion requires email verification. Check your inbox.');
    setIsDeleteAccountOpen(false);
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-10" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full transition-colors flex items-center justify-center"
              style={{ color: colors.textPrimary, backgroundColor: isDarkMode ? 'transparent' : undefined }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl" style={{ color: colors.textPrimary }}>
                Your Account
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Manage your profile and track your consistency
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full transition-colors flex items-center justify-center"
            style={{ color: colors.textPrimary, backgroundColor: isDarkMode ? 'transparent' : undefined }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profileAvatar} />
                    <AvatarFallback style={{ backgroundColor: '#A8E6CF', color: '#1C7C54' }}>
                      {editName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl mb-1" style={{ color: '#102A43' }}>
                      {editName}
                    </h2>
                    <p className="text-sm mb-2" style={{ color: '#102A43', opacity: 0.6 }}>
                      {editEmail}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: '#102A43', opacity: 0.5 }} />
                      <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                        Member since {fareScoreData.joinDate}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-4 py-2 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#1C7C54' }}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* FareScore Display */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-center mb-8">
                <h3 className="text-xl mb-2" style={{ color: '#102A43' }}>
                  Your FareScore
                </h3>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                  Health Consistency Rating
                </p>
              </div>

              {/* Circular Score Gauge */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-64 h-64 mb-6">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="110"
                      fill="none"
                      stroke="#E8F4F2"
                      strokeWidth="16"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="128"
                      cy="128"
                      r="110"
                      fill="none"
                      stroke={getScoreColor(fareScoreData.score)}
                      strokeWidth="16"
                      strokeDasharray={`${2 * Math.PI * 110}`}
                      strokeDashoffset={`${2 * Math.PI * 110 * (1 - getScorePercentage(fareScoreData.score) / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-6xl mb-2"
                      style={{ color: getScoreColor(fareScoreData.score) }}
                    >
                      {fareScoreData.score}
                    </motion.div>
                    <Badge
                      style={{
                        backgroundColor: getTierColor(fareScoreData.tier),
                        color: 'white',
                        fontSize: '14px',
                        padding: '4px 12px',
                      }}
                    >
                      {fareScoreData.tier}
                    </Badge>
                  </div>
                </div>

                {/* Change Indicator */}
                <div className="flex items-center gap-2 mb-4">
                  {fareScoreData.change >= 0 ? (
                    <ArrowUp className="w-5 h-5" style={{ color: '#1C7C54' }} />
                  ) : (
                    <ArrowDown className="w-5 h-5" style={{ color: '#E53E3E' }} />
                  )}
                  <span
                    className="text-lg"
                    style={{ color: fareScoreData.change >= 0 ? '#1C7C54' : '#E53E3E' }}
                  >
                    {Math.abs(fareScoreData.change)} points from last week
                  </span>
                </div>

                <p className="text-center max-w-md" style={{ color: '#102A43', opacity: 0.7 }}>
                  You've increased your FareScore by {fareScoreData.change} points in the past week. Great consistency!
                </p>
              </div>

              {/* Score Range Reference */}
              <div className="grid grid-cols-5 gap-2 mb-8">
                <div className="text-center">
                  <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: '#E53E3E' }} />
                  <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    Starting Journey
                  </p>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                    300-399
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: '#F5A623' }} />
                  <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    Building Habits
                  </p>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                    400-549
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: '#A8E6CF' }} />
                  <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    Consistent Tracker
                  </p>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                    550-699
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: '#1C7C54' }} />
                  <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    Goal Crusher
                  </p>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                    700-799
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: '#4DD4AC' }} />
                  <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                    FareFit Elite
                  </p>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                    800-850
                  </p>
                </div>
              </div>

              {/* Score History Graph */}
              <div>
                <h4 className="mb-4 flex items-center gap-2" style={{ color: '#102A43' }}>
                  <TrendingUp className="w-5 h-5" />
                  Score History
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fareScoreData.history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8F4F2" />
                      <XAxis dataKey="date" stroke="#102A43" opacity={0.6} />
                      <YAxis domain={[300, 850]} stroke="#102A43" opacity={0.6} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '2px solid #A8E6CF',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#1C7C54"
                        strokeWidth={3}
                        dot={{ fill: '#1C7C54', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Activity Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#E8F4F2' }}
                  >
                    <Award className="w-6 h-6" style={{ color: '#1C7C54' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                      Meals Logged
                    </p>
                    <p className="text-2xl" style={{ color: '#1C7C54' }}>
                      {fareScoreData.mealsLogged}
                    </p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                  This month
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#E8F4F2' }}
                  >
                    <Trophy className="w-6 h-6" style={{ color: '#F5A623' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                      Workouts
                    </p>
                    <p className="text-2xl" style={{ color: '#F5A623' }}>
                      {fareScoreData.workoutsCompleted}
                    </p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                  This month
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#E8F4F2' }}
                  >
                    <Calendar className="w-6 h-6" style={{ color: '#4DD4AC' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                      Streak Days
                    </p>
                    <p className="text-2xl" style={{ color: '#4DD4AC' }}>
                      {fareScoreData.streakDays}
                    </p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                  Current streak
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#FFE8E8' }}
                  >
                    <ArrowDown className="w-6 h-6" style={{ color: '#E53E3E' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                      Penalties
                    </p>
                    <p className="text-2xl" style={{ color: '#E53E3E' }}>
                      {fareScoreData.penalties}
                    </p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
                  Missed logs
                </p>
              </div>
            </div>

            {/* How FareScore Works */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h4 className="mb-4" style={{ color: '#102A43' }}>
                How FareScore Works
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#E8F4F2' }}
                  >
                    <ArrowUp className="w-4 h-4" style={{ color: '#1C7C54' }} />
                  </div>
                  <div>
                    <p className="mb-1" style={{ color: '#102A43' }}>
                      <strong>Increases Gradually</strong>
                    </p>
                    <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                      Log meals (+1), complete workouts (+2), hit macro targets (+3), maintain streaks (+5)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#FFE8E8' }}
                  >
                    <ArrowDown className="w-4 h-4" style={{ color: '#E53E3E' }} />
                  </div>
                  <div>
                    <p className="mb-1" style={{ color: '#102A43' }}>
                      <strong>Decreases with Inactivity</strong>
                    </p>
                    <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                      Miss daily logs (-2), break streaks (-5), inactive for a week (-10)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#E8F4F2' }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: '#1C7C54' }} />
                  </div>
                  <div>
                    <p className="mb-1" style={{ color: '#102A43' }}>
                      <strong>Updates Daily</strong>
                    </p>
                    <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                      Your score reflects consistency over time, not perfection. Small daily actions compound into big results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl flex items-center gap-2" style={{ color: '#102A43' }}>
                  <Trophy className="w-6 h-6" style={{ color: '#F5A623' }} />
                  Top FareScores
                </h3>
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="px-4 py-2 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#1C7C54' }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              <div className="space-y-3">
                {leaderboardData.map((entry) => (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: entry.rank * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md"
                    style={{
                      backgroundColor: entry.isCurrentUser ? '#E8F4F2' : '#F7F9FA',
                      border: entry.isCurrentUser ? '2px solid #1C7C54' : 'none',
                    }}
                  >
                    {/* Rank Badge */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          entry.rank === 1
                            ? '#F5A623'
                            : entry.rank === 2
                            ? '#A8A8A8'
                            : entry.rank === 3
                            ? '#CD7F32'
                            : '#E8F4F2',
                        color: entry.rank <= 3 ? 'white' : '#102A43',
                      }}
                    >
                      {entry.rank <= 3 ? <Trophy className="w-6 h-6" /> : `#${entry.rank}`}
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback style={{ backgroundColor: '#A8E6CF', color: '#1C7C54' }}>
                        {entry.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1">
                      <p style={{ color: '#102A43' }}>
                        {entry.name} {entry.isCurrentUser && <span className="text-sm opacity-60">(You)</span>}
                      </p>
                      <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                        {entry.username}
                      </p>
                    </div>

                    {/* FareScore */}
                    <div className="text-right">
                      <p className="text-2xl mb-1" style={{ color: getScoreColor(entry.fareScore) }}>
                        {entry.fareScore}
                      </p>
                      <Badge
                        style={{
                          backgroundColor: getTierColor(entry.tier),
                          color: 'white',
                          fontSize: '11px',
                        }}
                      >
                        {entry.tier}
                      </Badge>
                    </div>

                    {/* Change */}
                    <div className="flex items-center gap-1 w-20 justify-end">
                      {entry.change >= 0 ? (
                        <ArrowUp className="w-4 h-4" style={{ color: '#1C7C54' }} />
                      ) : (
                        <ArrowDown className="w-4 h-4" style={{ color: '#E53E3E' }} />
                      )}
                      <span
                        className="text-sm"
                        style={{ color: entry.change >= 0 ? '#1C7C54' : '#E53E3E' }}
                      >
                        {Math.abs(entry.change)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {leaderboardData[leaderboardData.length - 1]?.rank > 10 && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E8F4F2' }}>
                  <p className="text-center text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                    ... and {leaderboardData[leaderboardData.length - 1].rank - 6} more users
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl flex items-center gap-2" style={{ color: '#102A43' }}>
                  <Users className="w-6 h-6" style={{ color: '#1C7C54' }} />
                  Friends ({friends.length})
                </h3>
                <button
                  onClick={() => setIsAddFriendOpen(true)}
                  className="px-4 py-2 rounded-lg transition-all hover:opacity-90 flex items-center justify-center gap-2 text-white"
                  style={{ backgroundColor: '#1C7C54' }}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </button>
              </div>

              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md"
                    style={{ backgroundColor: '#F7F9FA' }}
                  >
                    {/* Avatar */}
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback style={{ backgroundColor: '#A8E6CF', color: '#1C7C54' }}>
                        {friend.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1">
                      <p className="mb-1" style={{ color: '#102A43' }}>
                        {friend.name}
                      </p>
                      <p className="text-sm mb-2" style={{ color: '#102A43', opacity: 0.6 }}>
                        {friend.username}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" style={{ color: '#102A43', opacity: 0.4 }} />
                          <span className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                            {friend.streakDays} day streak
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* FareScore */}
                    <div className="text-right mr-4">
                      <p className="text-2xl mb-1" style={{ color: getScoreColor(friend.fareScore) }}>
                        {friend.fareScore}
                      </p>
                      <div className="flex items-center gap-1 justify-end mb-1">
                        {friend.change >= 0 ? (
                          <ArrowUp className="w-3 h-3" style={{ color: '#1C7C54' }} />
                        ) : (
                          <ArrowDown className="w-3 h-3" style={{ color: '#E53E3E' }} />
                        )}
                        <span
                          className="text-xs"
                          style={{ color: friend.change >= 0 ? '#1C7C54' : '#E53E3E' }}
                        >
                          {Math.abs(friend.change)}
                        </span>
                      </div>
                      <Badge
                        style={{
                          backgroundColor: getTierColor(friend.tier),
                          color: 'white',
                          fontSize: '11px',
                        }}
                      >
                        {friend.tier}
                      </Badge>
                    </div>

                    {/* Cheer Button */}
                    <button
                      onClick={() => handleCheer(friend.id, friend.name)}
                      className="px-4 py-2 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                      style={{ 
                        borderColor: cheeredFriends.has(friend.id) ? '#FFB6B9' : '#A8E6CF', 
                        color: cheeredFriends.has(friend.id) ? '#FFB6B9' : '#1C7C54',
                        backgroundColor: cheeredFriends.has(friend.id) ? '#FFB6B920' : 'transparent'
                      }}
                    >
                      <Heart className="w-4 h-4" fill={cheeredFriends.has(friend.id) ? '#FFB6B9' : 'none'} />
                      {cheeredFriends.has(friend.id) ? 'Cheered!' : 'Cheer'}
                    </button>
                  </div>
                ))}
              </div>

              {friends.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#102A43', opacity: 0.2 }} />
                  <p className="mb-2" style={{ color: '#102A43', opacity: 0.6 }}>
                    No friends yet
                  </p>
                  <p className="text-sm" style={{ color: '#102A43', opacity: 0.5 }}>
                    Add friends to compare scores and support each other!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={isEditProfileOpen} 
        onOpenChange={(open) => {
          setIsEditProfileOpen(open);
          if (open) {
            // Reset form when opening - use current saved values
            setPreviewAvatar(profileAvatar);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#102A43' }}>Edit Profile</DialogTitle>
            <DialogDescription style={{ color: '#102A43', opacity: 0.6 }}>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label style={{ color: '#102A43' }}>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={previewAvatar} />
                  <AvatarFallback style={{ backgroundColor: '#A8E6CF', color: '#1C7C54' }}>
                    {editName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <label
                      htmlFor="avatar-upload"
                      className="px-4 py-2 rounded-lg border-2 transition-all hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-2"
                      style={{ borderColor: '#A8E6CF', color: '#1C7C54' }}
                    >
                      <Camera className="w-4 h-4" />
                      {previewAvatar ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    {previewAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-4 py-2 rounded-lg border-2 transition-all hover:bg-red-50 text-sm"
                        style={{ borderColor: '#FFE8E8', color: '#E53E3E' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" style={{ color: '#102A43' }}>Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
                style={{ borderColor: '#A8E6CF' }}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: '#102A43' }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter your email"
                style={{ borderColor: '#A8E6CF' }}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="px-4 py-2 rounded-lg border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#A8E6CF', color: '#102A43' }}
            >
              Cancel
            </button>
            <button
              onClick={handleEditProfile}
              className="px-6 py-2 rounded-lg transition-all hover:opacity-90 text-white"
              style={{ backgroundColor: '#1C7C54' }}
            >
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#102A43' }}>Share Your FareScore</DialogTitle>
            <DialogDescription style={{ color: '#102A43', opacity: 0.6 }}>
              Share your progress with friends and family
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-green-50 to-mint-50 rounded-xl p-6 text-center">
              <div className="text-5xl mb-3" style={{ color: getScoreColor(fareScoreData.score) }}>
                {fareScoreData.score}
              </div>
              <Badge
                style={{
                  backgroundColor: getTierColor(fareScoreData.tier),
                  color: 'white',
                  fontSize: '14px',
                  padding: '4px 12px',
                }}
              >
                {fareScoreData.tier}
              </Badge>
              <p className="mt-3 text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                {userName}'s FareScore
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`https://farefit.app/score/${userName.toLowerCase().replace(/\s+/g, '')}`}
                className="flex-1"
                style={{ borderColor: '#A8E6CF' }}
              />
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-white"
                style={{ backgroundColor: hasCopied ? '#1C7C54' : '#4DD4AC' }}
              >
                {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {hasCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Friend Dialog */}
      <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#102A43' }}>Add Friend</DialogTitle>
            <DialogDescription style={{ color: '#102A43', opacity: 0.6 }}>
              Connect with friends to compare scores and support each other
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username" style={{ color: '#102A43' }}>Username or Email</Label>
              <Input
                id="username"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                placeholder="@username or email@example.com"
                style={{ borderColor: '#A8E6CF' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFriend();
                  }
                }}
              />
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
              <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                💡 Tip: Friends can see each other's FareScores and send cheers for motivation!
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsAddFriendOpen(false)}
              className="px-4 py-2 rounded-lg border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#A8E6CF', color: '#102A43' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddFriend}
              className="px-6 py-2 rounded-lg transition-all hover:opacity-90 text-white flex items-center gap-2"
              style={{ backgroundColor: '#1C7C54' }}
            >
              <UserPlus className="w-4 h-4" />
              Send Request
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#102A43' }}>Settings</DialogTitle>
            <DialogDescription style={{ color: '#102A43', opacity: 0.6 }}>
              Manage your account preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Notifications Toggle */}
            <div className="px-4 py-3 rounded-lg border-2" style={{ borderColor: '#E8F4F2' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" style={{ color: '#1C7C54' }} />
                  <div>
                    <p style={{ color: '#102A43' }}>Notifications</p>
                    <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                      Daily reminders and updates
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="px-4 py-3 rounded-lg border-2" style={{ borderColor: '#E8F4F2' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {isDarkMode ? '🌙' : '☀️'}
                  </div>
                  <div>
                    <p style={{ color: '#102A43' }}>Dark Mode</p>
                    <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                      Switch to {isDarkMode ? 'light' : 'dark'} theme
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={onToggleDarkMode}
                />
              </div>
            </div>

            {/* Privacy Setting */}
            <div className="px-4 py-3 rounded-lg border-2" style={{ borderColor: '#E8F4F2' }}>
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5" style={{ color: '#1C7C54' }} />
                <div>
                  <p style={{ color: '#102A43' }}>Privacy</p>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                    Who can see your profile
                  </p>
                </div>
              </div>
              <Select value={privacySetting} onValueChange={handlePrivacyChange}>
                <SelectTrigger className="w-full mt-2" style={{ borderColor: '#A8E6CF' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Everyone can see</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private - Only you</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Units Preference */}
            <div className="px-4 py-3 rounded-lg border-2" style={{ borderColor: '#E8F4F2' }}>
              <div className="flex items-center gap-3 mb-2">
                <Ruler className="w-5 h-5" style={{ color: '#1C7C54' }} />
                <div>
                  <p style={{ color: '#102A43' }}>Units</p>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                    Measurement system
                  </p>
                </div>
              </div>
              <Select value={unitPreference} onValueChange={handleUnitsChange}>
                <SelectTrigger className="w-full mt-2" style={{ borderColor: '#A8E6CF' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                  <SelectItem value="imperial">Imperial (lbs, inches)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="border-t" style={{ borderColor: '#E8F4F2' }} />

            {/* Delete Account Button */}
            <button
              className="w-full px-4 py-3 rounded-lg border-2 transition-all hover:bg-red-50 flex items-center gap-3"
              style={{ borderColor: '#FFE8E8', color: '#E53E3E' }}
              onClick={() => setIsDeleteAccountOpen(true)}
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Account</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: '#E53E3E' }}>
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data including:
              <ul className="list-disc list-inside mt-3 space-y-1" style={{ color: '#102A43' }}>
                <li>Your FareScore history</li>
                <li>All logged meals and workouts</li>
                <li>Progress tracking data</li>
                <li>Friends and leaderboard connections</li>
              </ul>
              <p className="mt-3" style={{ color: '#102A43', opacity: 0.8 }}>
                You will receive an email confirmation before deletion is finalized.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderColor: '#A8E6CF', color: '#102A43' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="text-white"
              style={{ backgroundColor: '#E53E3E' }}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
