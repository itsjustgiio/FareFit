import { useState } from 'react';
import { ChevronDown, LogOut, User, UserCircle } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  onAccountClick?: () => void;
  isDarkMode?: boolean;
}

export function Header({ userName, onLogout, onAccountClick, isDarkMode = false }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="px-4 sm:px-6 lg:px-8 py-4 transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-primary)' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-white tracking-wide">FareFit</h1>
        
        {userName && onLogout ? (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
            >
              <User className="w-4 h-4" />
              <span>{userName}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-2 z-20 transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
                  {onAccountClick && (
                    <button
                      onClick={() => {
                        onAccountClick();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2 hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--farefit-text)' }}
                    >
                      <UserCircle className="w-4 h-4" />
                      My Account
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onLogout();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--farefit-text)' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <span>Need help?</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}