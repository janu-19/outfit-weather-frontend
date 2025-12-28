import { useState } from 'react';
import { HeroSection } from './HeroSection';
import { ResultSection } from './ResultSection';
import { analyzeOutfit, predictOutfit } from '../api';
import { AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function PredictPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async (data) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get Prediction & ID (Critical for Verification)
            // This endpoint (/predict-outfit) is the Source of Truth for the image ID.
            let predictionRes;
            try {
                predictionRes = await predictOutfit(data.file);
                // predictionRes = { id, predicted_class, confidence, image_url, ... }
            } catch (predErr) {
                console.error("Prediction/Upload failed:", predErr);
                if (predErr.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    return;
                }
                throw new Error("Failed to upload image for prediction.");
            }

            if (!predictionRes || !predictionRes.id) {
                throw new Error("Prediction success but no ID returned from backend.");
            }

            // 2. Run Comprehensive Analysis (Weather, Fabric, etc.)
            // We pass the class we just detected to hint the analysis
            const analysisData = {
                ...data,
                manual_outfit_type: predictionRes.predicted_class // optimization
            };

            let analysisRes;
            try {
                analysisRes = await analyzeOutfit(analysisData);
            } catch (anaErr) {
                console.warn("Analysis partial failure:", anaErr);
                // If analysis fails (e.g. weather API down), we should still show the prediction result!
                // We mock a basic analysis result based on prediction
                analysisRes = {
                    data: {
                        outfitIncluded: true,
                        outfitType: predictionRes.predicted_class,
                        outfitScore: (predictionRes.confidence || 0) * 100,
                        weather: { temp: '--', condition: 'Unknown', breakdown: [] },
                        verdict: "Weather data unavailable",
                        suggestions: []
                    }
                };
            }

            setResult({
                ...analysisRes.data,
                // Ensure we use the robust values from the specific prediction endpoint
                image_url: predictionRes.image_url || analysisRes.data.image_url,
                image_id: predictionRes.id, // THE HOLY GRAIL ID
                outfitType: predictionRes.predicted_class || analysisRes.data.outfitType,
                outfitScore: (predictionRes.confidence * 100) || analysisRes.data.outfitScore
            });
        } catch (err) {
            console.error(err);
            setError('Failed to analyze outfit. Please try again.');
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
                        <HeroSection onAnalyze={handleAnalyze} isLoading={loading} />
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
