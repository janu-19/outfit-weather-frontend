import { useState } from 'react';
import { HeroSection } from './HeroSection';
import { ResultSection } from './ResultSection';
import { analyzeOutfit, predictOutfit } from '../api';
import { AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';

export function PredictPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [totalUsage, setTotalUsage] = useState(() => {
        try {
            return parseInt(localStorage.getItem('total_usage') || '0', 10) || 0;
        } catch (e) { return 0; }
    });

    const handleAnalyze = async (data) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get Prediction
            // api.predictOutfit now automatically switches between guest/auth based on token
            let predictionRes;
            try {
                predictionRes = await predictOutfit(data);
                console.log("Prediction Response:", predictionRes); // Debug logging
            } catch (predErr) {
                console.error("Prediction failed:", predErr);
                if (predErr.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    return;
                }
                const errorMsg = predErr.response?.data?.detail || predErr.message || "Failed to analyze outfit.";
                throw new Error(errorMsg);
            }


            // 2. Run Comprehensive Analysis
            // We drive the extensive analysis using the prediction result and fetching extra data (travel pack)
            let analysisRes;
            try {
                // predictionRes is the raw data from /predict/guest (or auth)
                // We pass it to analyzeOutfit to format it and enrich with /travel-pack data
                analysisRes = await analyzeOutfit(predictionRes, data.city, data.manual_outfit_type);

            } catch (anaErr) {
                console.warn("Secondary analysis failed/skipped.", anaErr);
                // Fallback if analyzeOutfit fails totally (unlikely with new logic, but safe to keep)
                const weatherObj = predictionRes.weather || predictionRes.weather_summary || {};
                const weatherVerdict = predictionRes.weather?.verdict || predictionRes.weather_verdict || "Analysis Complete";

                analysisRes = {
                    data: {
                        outfitIncluded: true,
                        outfitType: predictionRes.predicted_class,
                        outfitScore: (predictionRes.confidence || 0) * 100,
                        weather: {
                            temp: weatherObj.temperature || weatherObj.current_temp || '--',
                            condition: weatherObj.description || weatherObj.condition || 'Unknown',
                            breakdown: []
                        },
                        verdict: weatherVerdict,
                        reasons: predictionRes.match_reasons || [],
                        suggestions: predictionRes.suggested_alternatives || [],
                        accessories: predictionRes.accessories || [],
                        packingList: []
                    }
                };
            }

            // If user provided a manual override, prefer it (trimmed)
            const manualOverride = data?.manual_outfit_type?.trim();

            const finalOutfitType = manualOverride || predictionRes.predicted_class || analysisRes.data.outfitType;

            // Add a small note if override used
            const finalReasons = Array.isArray(analysisRes.data.reasons) ? [...analysisRes.data.reasons] : (analysisRes.data.reasons || []);
            if (manualOverride) finalReasons.unshift(`User override: ${manualOverride}`);

            setResult({
                ...analysisRes.data,
                // Ensure we use the robust values from the specific prediction endpoint
                image_url: predictionRes.image_url || analysisRes.data.image_url,
                image_id: predictionRes.id || null,
                outfitType: finalOutfitType,
                outfitScore: (predictionRes.confidence * 100) || analysisRes.data.outfitScore,
                occasion: data.occasion,
                material: data.material,
                reasons: finalReasons
            });
            // Increment usage counter (local only). This helps show product usage during development.
            try {
                const prev = parseInt(localStorage.getItem('total_usage') || '0', 10) || 0;
                const next = prev + 1;
                localStorage.setItem('total_usage', String(next));
                setTotalUsage(next);
                console.debug('Total usage incremented to', next);
            } catch (e) {
                console.warn('Failed to update local usage counter', e);
            }
        } catch (err) {
            console.error("Analysis Error:", err);
            const msg = err.response?.data?.detail
                || err.message
                || 'Failed to analyze outfit. Please check your connection.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!result ? (
                    <motion.div
                        key="hero"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <HeroSection onAnalyze={handleAnalyze} isLoading={loading} totalUsage={totalUsage} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <ResultSection data={result} onReset={handleReset} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast / Error Notification */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl shadow-lg border border-red-100 flex items-center gap-2"
                    >
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
