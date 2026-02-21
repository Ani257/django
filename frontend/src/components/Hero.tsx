import React from 'react';

const Hero = () => {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-gray-50/50">
            <div className="container px-4 md:px-6 max-w-screen-xl mx-auto">
                <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-red-100 text-red-900 hover:bg-red-100/80">
                                🚨 Live Gamified Drop
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                The Price Drops Every Time You Share.
                            </h1>
                            <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                                Team up with the community. Every share knocks ₹1 off the price. Buy when it hits your target, but act fast before stock runs out.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">1</span>
                                Drop Starts High
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-400 hidden sm:flex">
                                <span className="h-px w-8 bg-gray-200"></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">2</span>
                                Share to Discount
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-400 hidden sm:flex">
                                <span className="h-px w-8 bg-gray-200"></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-black">3</span>
                                Secure the Bag
                            </div>
                        </div>
                    </div>
                    <div className="mx-auto flex w-full items-center justify-center lg:max-w-none">
                        <div className="relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-gray-900/10 shadow-2xl group">
                            <img
                                src="https://images.unsplash.com/photo-1550997758-58ed6de01c71?q=80&w=2000&auto=format&fit=crop"
                                alt="Vintage Leather Jacket Premium"
                                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none"></div>
                            <div className="absolute top-4 left-4 inline-flex items-center rounded-full bg-black/80 px-3 py-1 text-sm font-medium text-white backdrop-blur-md">
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
