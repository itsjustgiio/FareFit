// This is a reference implementation showing the key dark mode changes needed for PrivacyPage.tsx
// Apply these patterns to the actual PrivacyPage.tsx file

// Main container - Line ~103
<div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
  
// Header - Line ~105  
<div style={{ backgroundColor: 'var(--color-card-bg)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--color-border)' }}>
  
// Back button text - Line ~110
style={{ color: 'var(--color-text)' }}

// Title and text colors - Lines ~122-126
<Lock className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
<h1 style={{ color: 'var(--color-text)' }}>Your Privacy, Our Priority</h1>
<p className="text-lg mb-4" style={{ color: 'var(--color-text)', opacity: 0.8 }}>

// Info box - Line ~128-132
<div 
  className="inline-block px-6 py-3 rounded-lg text-sm"
  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
>

// Section headers - Line ~138
<h2 className="mb-6" style={{ color: 'var(--color-text)' }}>What We Collect</h2>

// Cards - Line ~141
<div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)' }}>
  
// Icon backgrounds - Line ~143-145
<div 
  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
  style={{ backgroundColor: 'var(--color-primary-light)' }}
>
  <item.icon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
</div>

// Card text - Lines ~148-150
<h3 className="mb-2" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
<p className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.7 }}>

// All white backgrounds
style={{ backgroundColor: 'var(--color-card-bg)' }}

// All borders
style={{ borderColor: 'var(--color-border)' }}

// All primary green colors
style={{ color: 'var(--color-primary)' }}

// All text colors
style={{ color: 'var(--color-text)' }}

// Button hover states - add dark mode variants
className="... hover:bg-gray-50 dark:hover:bg-gray-800"
