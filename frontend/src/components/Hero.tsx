import React from 'react';

const Hero = () => {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 relative bg-transparent">
            <div className="container px-4 md:px-6 max-w-screen-xl mx-auto relative z-10">
                <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors border-red-500/30 bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                🚨 Live Gamified Drop
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter sm:text-6xl xl:text-8xl/none uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 drop-shadow-md">
                                The Price Drops Every Time You Share.
                            </h1>
                            <p className="max-w-[600px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-medium">
                                Team up with the community. Every share knocks ₹1 off the price. Buy when it hits your target, but act fast before stock runs out.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-300">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">1</span>
                                Drop Starts High
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-400 hidden sm:flex">
                                <span className="h-px w-8 bg-gray-200"></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-300">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">2</span>
                                Share to Discount
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-400 hidden sm:flex">
                                <span className="h-px w-8 bg-gray-200"></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-300">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-red-500 text-red-500">3</span>
                                Secure the Bag
                            </div>
                        </div>
                    </div>
                    <div className="mx-auto relative w-full flex items-center justify-center lg:max-w-none">
                        {/* Primary Image Container */}
                        <div className="relative w-full max-w-[500px] aspect-square rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] z-10 group bg-zinc-900 border border-zinc-800 overflow-hidden cursor-pointer hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] transition-shadow duration-500">
                            {/* Primary Image - Sneaker (Background) */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://images.unsplash.com/photo-1552346154-21d32810baa3?w=800&q=80"
                                alt="Featured Drop - Sneakers"
                                className="object-cover w-full h-full opacity-50 group-hover:opacity-40 transition-opacity duration-500 blur-[2px] group-hover:blur-md scale-105 group-hover:scale-100"
                            />

                            {/* Secondary Image - Streetwear (Centered Inside) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] aspect-[3/4] rounded-2xl shadow-2xl z-20 group-hover:scale-110 transition-transform duration-500 bg-zinc-900 border border-zinc-700 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80"
                                    alt="Featured Drop - Streetwear"
                                    className="object-cover w-full h-full opacity-100"
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none"></div>
                            </div>

                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none z-30"></div>

                            <div className="absolute top-4 left-4 z-40 inline-flex items-center rounded-full bg-black/80 border border-red-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-500 backdrop-blur-md shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                Featured Drop
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
