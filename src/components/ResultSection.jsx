import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { AccessoriesGrid } from './AccessoriesGrid';
import { PackingList } from './PackingList';
import { Check, X, Thermometer, CloudRain, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { submitFeedback, wardrobeAPI, authAPI } from '../api';
import { toast } from 'react-toastify';
import { Heart, Save } from 'lucide-react';

function FeedbackModal({ isOpen, onClose, onSubmit, isSubmitting, defaultCategory }) {
    if (!isOpen) return null;

    const [category, setCategory] = useState(defaultCategory || '');
    const [notes, setNotes] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Help Us Improve</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <p className="text-sm text-slate-500 mb-4">
                    Was the outfit detection incorrect? Let us know what the actual category is.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correct Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="" disabled>Select category...</option>
                            <option value="Saree">Saree</option>
                            <option value="Kurti">Kurti</option>
                            <option value="T-Shirt">T-Shirt</option>
                            <option value="Shirt">Shirt</option>
                            <option value="Jeans">Jeans</option>
                            <option value="Trousers">Trousers</option>
                            <option value="Dress">Dress</option>
                            <option value="Jacket">Jacket</option>
                            <option value="Blazer">Blazer</option>
                            <option value="Lehenga">Lehenga</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            placeholder="Any additional details..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button
                            onClick={() => onSubmit(category, notes)}
                            disabled={!category || isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ResultSection({ data, onReset }) {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    if (!data) return null;

    const handleFeedbackSubmit = async (category, notes) => {
        setIsSubmitting(true);
        try {
            // RELAXED RULE: Image ID is optional for guest feedback
            const response = await submitFeedback({
                // Pass ID if available, else null
                image_id: data.image_id || null,
                user_selected_category: category,
                // These are critical for training when we don't have an ID
                model_predicted_category: data.outfitType,
                confidence: data.outfitScore / 100,
                // Add weather context if available in data
                weather_context: data.weather || {},
                notes: notes || ""
            });

            if (response && response.model_updated) {
                toast.success("Feedback Saved! Model has learned from your input. 🧠✨");
            } else {
                toast.success("Thanks for your feedback!");
            }

            setIsFeedbackOpen(false);
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to submit feedback.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerification = async (isCorrect) => {
        if (isCorrect) {
            setIsSubmitting(true);
            try {
                const response = await submitFeedback({
                    image_id: data.image_id || null,
                    user_selected_category: data.outfitType,
                    model_predicted_category: data.outfitType,
                    confidence: data.outfitScore / 100,
                    weather_context: data.weather || {},
                    notes: "User verified as correct"
                });

                if (response && response.model_updated) {
                    toast.success("Great! The model has learned from this confirmation. 🧠✅");
                } else {
                    toast.success("Thanks for verifying!");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to verify.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // Instead of just opening feedback, we ask "What would you prefer instead?"
            setIsFeedbackOpen(true);
        }
    };

    const handleSaveToWardrobe = async () => {
        setIsSaving(true);
        try {
            const outfitPayload = {
                image_url: data.image_url,
                category: data.outfitType,
                occasion: data.occasion || 'Casual',
                notes: `Saved from analysis. ${data.verdict}`,
                color: 'Multi', // meaningful default or extracted if available
            };

            const token = authAPI.getToken();
            if (token) {
                // User is logged in, save directly
                await wardrobeAPI.saveOutfit(outfitPayload);
                toast.success("Outfit saved to your Wardrobe! 🧥✨");
            } else {
                // Guest mode: Save to local storage and redirect to signup
                localStorage.setItem('pendingOutfit', JSON.stringify(outfitPayload));
                toast.info("Create a free account to save your outfit!");
                navigate('/signup');
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save outfit.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up relative">
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                onSubmit={handleFeedbackSubmit}
                isSubmitting={isSubmitting}
                defaultCategory=""
            />

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Analysis Result</h2>
                <div className="flex gap-2">
                    <Button
                        onClick={handleSaveToWardrobe}
                        isLoading={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                    >
                        <Heart className="w-4 h-4 mr-2" />
                        Save to Wardrobe
                    </Button>
                    <Button variant="ghost" onClick={onReset} className="text-sm">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Analyze New
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Verdict Card */}
                <Card className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            {data.outfitType && (
                                <p className="text-sm font-semibold text-blue-600 mb-1 uppercase tracking-wide">
                                    Detected: {data.outfitType}
                                </p>
                            )}
                            <h3 className="text-lg font-medium text-slate-500">Verdict</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-3xl font-bold ${data.verdictColor === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.verdict}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Confidence</p>
                            <span className={`text-lg font-bold px-3 py-1 rounded-full bg-${data.confidenceColor}-100 text-${data.confidenceColor}-700 whitespace-nowrap`}>
                                {data.confidenceLabel}
                            </span>
                        </div>
                    </div>

                    {/* Reasons (Explainability) */}
                    {data.reasons && data.reasons.length > 0 && (
                        <div className="space-y-1">
                            {data.reasons.map((reason, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-slate-600">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium">{reason}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
                            <Thermometer className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-slate-500">Temp</p>
                                <p className="font-bold text-slate-800">{data.weather.temp}°C</p>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl flex items-center gap-3">
                            <CloudRain className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Weather Context</p>
                                <div className="space-y-0.5">
                                    {data.weather.breakdown.map((item, idx) => (
                                        <p key={idx} className="text-xs font-semibold text-slate-700">{item}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fabric Awareness Card */}
                    {data.fabricTips && (
                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
                            <h4 className="font-semibold text-amber-900 mb-2">{data.fabricTips.title}</h4>
                            <p className="text-amber-800 text-sm leading-relaxed">
                                {data.fabricTips.tip}
                            </p>
                        </div>
                    )}

                    {/* Suggested Alternatives */}
                    {data.suggestions && data.suggestions.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Alternative Options</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.suggestions.map((item, idx) => (
                                    <span key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Verification UI - Moved to bottom and made smaller */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Was this helpful?</p>
                                <p className="text-xs text-slate-500">Your feedback improves recommendations.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleVerification(true)}
                                disabled={isSubmitting}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 h-8 text-xs disabled:opacity-50 disabled:cursor-not-allowed border-slate-200 border"
                                title="Confirm Prediction"
                            >
                                👍 Yes
                            </Button>
                            <Button
                                onClick={() => handleVerification(false)}
                                disabled={isSubmitting}
                                variant="outline"
                                className="border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1 h-8 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Report issue"
                            >
                                👎 No
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Packing List / Accessories Column */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-semibold text-slate-800 mb-4">You might need</h3>
                        <AccessoriesGrid items={data.accessories} />
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-slate-800 mb-4">Travel Essentials</h3>
                        <PackingList items={data.packingList} />
                    </Card>
                </div>
            </div>
        </div>
    );
}
