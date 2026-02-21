'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                <Card className="border-2 shadow-xl rounded-2xl overflow-hidden">
                    <CardHeader className="space-y-2 text-center pb-8 pt-10">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-md mb-4">
                            <span className="text-3xl font-bold">D</span>
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight">Drop Street</CardTitle>
                        <CardDescription className="text-base text-muted-foreground font-medium">
                            Sign in to secure your drop and start participating in live reverse auctions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8 px-8">
                        <Button
                            size="lg"
                            className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-black hover:bg-black/90 text-white"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <svg className="mr-3 h-5 w-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            Continue with Google
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center border-t bg-muted/40 p-6">
                        <p className="text-center text-xs leading-relaxed text-muted-foreground w-full">
                            By authenticating, you agree to our{" "}
                            <a href="#" className="underline underline-offset-4 hover:text-black font-medium transition-colors">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="#" className="underline underline-offset-4 hover:text-black font-medium transition-colors">
                                Privacy Policy
                            </a>.
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
