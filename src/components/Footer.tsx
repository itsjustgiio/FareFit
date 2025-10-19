import React from 'react';

type NavigationPage = 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai';

interface FooterProps {
  onNavigate?: (page: NavigationPage) => void;
  onFeedbackClick?: () => void;
}

type FooterLink = 
  | { label: string; page: NavigationPage }
  | { label: string; action: 'feedback' }
  | { label: string; href: string; external: boolean };

// Type guards
const isNavigationPage = (link: FooterLink): link is { label: string; page: NavigationPage } => 'page' in link;
const isFeedbackAction = (link: FooterLink): link is { label: string; action: 'feedback' } => 'action' in link;
const isExternalLink = (link: FooterLink): link is { label: string; href: string; external: boolean } => 'href' in link;

export function Footer({ onNavigate, onFeedbackClick }: FooterProps) {
  const links: FooterLink[] = [
    { label: 'Help', page: 'help' },
    { label: 'Feedback', action: 'feedback' },
    { label: 'Privacy', page: 'privacy' },
    { label: 'Terms', page: 'terms' },
    { label: 'GitHub', href: 'https://github.com/itsjustgiio/FareFit', external: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/giovannicarrion/', external: true }
  ];

  const handleClick = (link: FooterLink, e: React.MouseEvent) => {
    if (isNavigationPage(link) && onNavigate) {
      e.preventDefault();
      onNavigate(link.page);
    } else if (isFeedbackAction(link) && onFeedbackClick) {
      e.preventDefault();
      onFeedbackClick();
    }
  };

  return (
    <footer className="mt-auto pt-16">
      <div 
        className="py-6 bg-gradient-to-t"
        style={{ 
          backgroundImage: 'linear-gradient(to top, #2f7a59, #31835f)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            {/* Links Row */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={'page' in link || 'action' in link ? '#' : link.href}
                  target={isExternalLink(link) ? '_blank' : undefined}
                  rel={isExternalLink(link) ? 'noopener noreferrer' : undefined}
                  onClick={(e) => handleClick(link, e)}
                  className="text-xs hover:text-white hover:underline underline-offset-4 transition-all cursor-pointer"
                  style={{ color: 'white', opacity: 0.8 }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            
            {/* Tagline */}
            <p className="text-xs text-center" style={{ color: 'white', opacity: 0.6 }}>
              © 2025 FareFit — Helping you live healthier with AI.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}