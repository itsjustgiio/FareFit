interface FooterProps {
  onNavigate?: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick?: () => void;
}

export function Footer({ onNavigate, onFeedbackClick }: FooterProps) {
  const links = [
    { label: 'Help', page: 'help' as const },
    { label: 'Feedback', action: 'feedback' as const },
    { label: 'Privacy', page: 'privacy' as const },
    { label: 'Terms', page: 'terms' as const },
    { label: 'GitHub', href: 'https://github.com/itsjustgiio', external: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/giovannicarrion/', external: true }
  ];

  const handleClick = (link: typeof links[0], e: React.MouseEvent) => {
    if ('page' in link && onNavigate) {
      e.preventDefault();
      onNavigate(link.page);
    } else if ('action' in link && link.action === 'feedback' && onFeedbackClick) {
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
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
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