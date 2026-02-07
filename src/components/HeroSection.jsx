import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Added this
import { Upload, MapPin, Calendar, X, Layers, Crosshair } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { clsx } from 'clsx';
import axios from 'axios';

export function HeroSection({ onAnalyze, isLoading, totalUsage = 0 }) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [city, setCity] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [occasion, setOccasion] = useState('Casual');
    const [material, setMaterial] = useState('');
    const [manualOutfitType, setManualOutfitType] = useState('');

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        setFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
    };

    const handleLocationClick = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Reverse geocoding using OpenStreetMap (Nominatim)
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                    params: { format: 'json', lat: latitude, lon: longitude, addressdetails: 1 }
                });

                const address = response.data?.address || {};

                // Prefer city-like fields, then fallbacks
                const detectedCity = (address.city || address.town || address.village || address.hamlet || address.county || address.state || address.region || '').trim();

                if (detectedCity) {
                    // Use display_name if city is generic; include country for better server matching
                    const country = address.country ? `, ${address.country}` : '';
                    setCity(`${detectedCity}${country}`);
                } else if (response.data?.display_name) {
                    // Last resort: use the display_name (may be verbose)
                    setCity(response.data.display_name.split(',')[0]);
                } else {
                    alert("Could not detect city name. Please enter manually.");
                }
            } catch (error) {
                console.error("Location error:", error);
                alert("Failed to fetch location info. Please enter city manually.");
            } finally {
                setIsLocating(false);
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            setIsLocating(false);
            if (error.code === error.PERMISSION_DENIED) {
                alert("Location permission denied. Please enter your city manually.");
            } else {
                alert("Unable to retrieve your location. Please enter your city manually.");
            }
        }, { timeout: 10000 });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file || !city) return;
        const trimmedCity = city.trim();
        // If reverse geocoder added country ("City, Country"), only send the city part to backend
        const cityOnly = trimmedCity.split(',')[0].trim();
        console.debug('Submitting with city:', cityOnly);
        onAnalyze({ file, city: cityOnly, occasion, material, manual_outfit_type: manualOutfitType });
    };

    // Helper to focus input
    const focusInput = () => {
        const input = document.querySelector('input[placeholder="Enter city or detect location"]');
        if (input) input.focus();
    };

    return (
        <div className="w-full max-w-xl mx-auto space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-800">
                    Outfit Analysis
                </h1>
                <p className="text-slate-500">
                    Upload your outfit to get AI-powered styling advice
                </p>
                <p className="text-xs text-slate-400">Analyses run: <span className="font-medium text-slate-700">{totalUsage}</span></p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Area */}
                    <div
                        className={clsx(
                            "relative border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer",
                            dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400",
                            preview ? "border-solid border-blue-200 p-0 overflow-hidden h-64" : ""
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {preview ? (
                            <div className="relative h-full w-full">
                                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white shadow-sm"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                                <Upload className="w-10 h-10 text-blue-500 mb-3" />
                                <p className="text-slate-600 font-medium">Drag & drop your outfit here</p>
                                <p className="text-slate-400 text-sm mt-1">or click to browse</p>
                                <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
                            </label>
                        )}
                    </div>

                    {/* Guest Privacy Notice */}
                    <div className="text-center">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                            <Layers className="w-3 h-3" /> {/* reusing an icon or just text */}
                            Guest images are processed temporarily and deleted automatically.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* City Input with Geolocation */}
                        <div className="relative md:col-span-2">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Enter city or detect location"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleLocationClick}
                                disabled={isLocating}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                                title="Detect Location"
                            >
                                <Crosshair className={clsx("w-5 h-5", isLocating && "animate-spin")} />
                            </button>
                        </div>

                        {/* Occasion Dropdown */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={occasion}
                                onChange={(e) => setOccasion(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                <option value="Casual">Casual / Day Out</option>
                                <option value="Office">Office / Work</option>
                                <option value="Party">Party / Event</option>
                                <option value="Travel">Travel / Vacation</option>
                            </select>
                        </div>

                        {/* Material Input (New) */}
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={material}
                                onChange={(e) => setMaterial(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                <option value="">Select Material</option>
                                <option value="cotton">Cotton</option>
                                <option value="silk">Silk</option>
                                <option value="polyester">Polyester</option>
                                <option value="wool">Wool</option>
                                <option value="linen">Linen</option>
                                <option value="denim">Denim</option>
                                <option value="blend">Blend / Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Manual Outfit Type (Optional) - Dropdown override */}
                    <div className="grid grid-cols-1">
                        <select
                            value={manualOutfitType}
                            onChange={(e) => setManualOutfitType(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                        >
                            <option value="">Select outfit type (use model prediction)</option>
                            <option value="Shirt">Shirt</option>
                            <option value="T-Shirt">T-Shirt</option>
                            <option value="Kurta">Kurta</option>
                            <option value="Saree">Saree</option>
                            <option value="Dress">Dress</option>
                            <option value="Jacket">Jacket</option>
                            <option value="Coat">Coat</option>
                            <option value="Pants">Pants / Trousers</option>
                            <option value="Shorts">Shorts</option>
                            <option value="Skirt">Skirt</option>
                            <option value="Tunic">Tunic</option>
                            <option value="Other">Other / Describe</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-2">Select to override the model's predicted outfit type.</p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full text-lg py-4"
                        isLoading={isLoading}
                        disabled={!file || !city}
                    >
                        Analyze Outfit
                    </Button>
                </form>
            </Card>
        </div>
    );
}
