import { useState } from 'react';
import { X, Upload, Star, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
}

type FeedbackType = 'bug' | 'feature' | 'general' | null;

export function FeedbackModal({ isOpen, onClose, currentPage = 'Dashboard' }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [wantsFollowUp, setWantsFollowUp] = useState(false);
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = () => {
    setFeedbackType(null);
    setFeedbackText('');
    setRating(0);
    setWantsFollowUp(false);
    setEmail('');
    setScreenshot(null);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    // Here you would send the feedback to your backend
    console.log({
      type: feedbackType,
      text: feedbackText,
      rating,
      email: wantsFollowUp ? email : null,
      screenshot,
      page: currentPage
    });
    
    setIsSubmitted(true);
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const canSubmit = feedbackType && feedbackText.trim().length > 0;

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Feedback Submitted</DialogTitle>
            <DialogDescription className="sr-only">
              Your feedback has been successfully submitted
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--color-primary-light)' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 className="mb-2" style={{ color: 'var(--color-text)' }}>Feedback sent — thank you!</h3>
            <p className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
              Your input helps make FareFit even better 💪
            </p>
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-2 rounded-md border transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Send Another
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--color-text)' }}>We value your feedback</DialogTitle>
          <DialogDescription style={{ color: 'var(--color-text)', opacity: 0.7 }}>
            How can we make FareFit better?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label style={{ color: 'var(--color-text)' }}>What would you like to share?</Label>
            <div className="space-y-2">
              {[
                { value: 'bug', label: 'Report a bug' },
                { value: 'feature', label: 'Suggest a feature' },
                { value: 'general', label: 'Share general feedback' }
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  style={{ 
                    borderColor: feedbackType === option.value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: feedbackType === option.value ? 'var(--color-primary-light)' : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="feedbackType"
                    value={option.value}
                    checked={feedbackType === option.value}
                    onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--color-text)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback-text" style={{ color: 'var(--color-text)' }}>
              Your feedback
            </Label>
            <Textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type your feedback here..."
              className="min-h-[120px]"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
              Feedback from: {currentPage}
            </p>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label style={{ color: 'var(--color-text)' }}>
              How would you rate your FareFit experience today?
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="w-8 h-8"
                    fill={star <= rating ? '#FFB6B9' : 'none'}
                    stroke={star <= rating ? '#FFB6B9' : 'var(--color-border)'}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label htmlFor="screenshot" style={{ color: 'var(--color-text)' }}>
              Attach screenshot (optional)
            </Label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="screenshot"
                className="flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">Choose File</span>
              </label>
              {screenshot && (
                <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
                  {screenshot.name}
                </span>
              )}
            </div>
            <input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Follow-up Option */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsFollowUp}
                onChange={(e) => setWantsFollowUp(e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                Would you like us to reach out?
              </span>
            </label>
            
            {wantsFollowUp && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-card-bg)' }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-2 rounded-md border transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 px-6 py-2 rounded-md text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Send Feedback
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}