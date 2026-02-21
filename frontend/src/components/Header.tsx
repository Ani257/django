import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center px-4 mx-auto">
        <div className="flex items-center gap-2 mr-4 flex-1">
          <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xl drop-shadow-md">
            D
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
            Drop Street
          </span>
        </div>
        
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Drops
          </a>
          <a href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
            How it Works
          </a>
          <a href="#" className="transition-colors hover:text-foreground/80 text-foreground/60 hidden sm:block">
            Community
          </a>
        </nav>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-black text-white hover:bg-black/90 h-9 px-4 py-2 shadow-md">
             Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
