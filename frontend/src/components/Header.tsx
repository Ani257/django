import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-red-500/30 bg-black/50 backdrop-blur-md supports-[backdrop-filter]:bg-black/40">
      <div className="container flex h-16 max-w-screen-xl items-center px-4 mx-auto">
        <div className="flex flex-1 items-center gap-2 mr-4">
          <div className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xl drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            D
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
            Drop Street
          </span>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="transition-colors hover:text-white text-gray-400">
            Drops
          </a>
          <a href="#" className="transition-colors hover:text-white text-gray-400">
            How it Works
          </a>
          <a href="#" className="transition-colors hover:text-white text-gray-400 hidden sm:block">
            Community
          </a>
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-600 text-white hover:bg-red-500 h-9 px-4 py-2 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
