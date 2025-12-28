import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shirt, Cloud, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export function HomePage() {
    return (
        <div className="w-full min-h-[80vh] flex flex-col justify-center items-center">
            {/* Split Layout: Left Content, Right Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl px-6 gap-12">

                {/* Left Side: App Introduction */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex-1 text-center md:text-left space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>AI-Powered Fashion Assistant</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 leading-tight">
                        <span className="text-blue-600">Style Meets</span> <br />
                        <span className="text-blue-600">
                            Weather Intelligence
                        </span>
                    </h1>

                    <p className="text-lg text-slate-500 max-w-xl mx-auto md:mx-0 leading-relaxed">
                        Effortlessly plan your outfits based on real-time weather data.
                        Get smart recommendations, organize your wardrobe, and look your best without the guesswork.
                    </p>

                    {/* Features Grid */}
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link to="/signup" className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-blue-200 transition-colors cursor-pointer group">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Cloud className="w-5 h-5" />
                            </div>
                            <span className="text-slate-700 font-medium">Weather Sync</span>
                        </Link>
                        <Link to="/wardrobe" className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-purple-200 transition-colors cursor-pointer group">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <Shirt className="w-5 h-5" />
                            </div>
                            <span className="text-slate-700 font-medium">Smart Wardrobe</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Right Side: Login / Signup Actions */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex-1 w-full max-w-md"
                >
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transform rotate-3">
                                <Shirt className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Get Started</h2>
                            <p className="text-slate-500">Join efficiently to curate your style.</p>
                        </div>

                        <div className="space-y-4">
                            <Link
                                to="/login"
                                className="block w-full py-4 text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Sign In
                            </Link>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">New here?</span>
                                </div>
                            </div>

                            <Link
                                to="/signup"
                                className="block w-full py-4 text-center bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all hover:bg-slate-50"
                            >
                                Create Account
                            </Link>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Secure & Private Personalization</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
