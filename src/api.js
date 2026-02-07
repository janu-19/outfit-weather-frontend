import axios from 'axios';

const getApiBase = () => {
    return localStorage.getItem('server_mode') === 'local'
        ? 'http://localhost:8000'
        : 'https://outfit-weather-backend.onrender.com';
};

// Create axios instance
const api = axios.create({
    baseURL: getApiBase(),
});

// Request interceptor to add auth token AND dynamic base URL
api.interceptors.request.use(
    (config) => {
        // Update URL dynamically in case user toggled switch
        config.baseURL = getApiBase();

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const analyzeOutfit = async (predictionData, city, manualOverride) => {
    try {
        console.log("analyzeOutfit received:", predictionData); // Debug log

        // We no longer call /outfit-weather as it doesn't exist.
        // We use the data from predictOutfit (predictionData) and enrich it with /travel-pack

        let travelData = { suggested_clothes: [], packing_recommendation: {} };
        try {
            if (city) {
                const travelResponse = await api.get('/travel-pack', {
                    params: { city: city }
                });
                travelData = travelResponse.data;
            }
        } catch (err) {
            console.warn("Travel pack fetch failed", err);
        }

        // Map predictionData to the structure expected by our formatting logic
        // predictionData comes from predictGuest/predictAuth
        let weatherObj = predictionData.weather || predictionData.weather_summary || {};

        // If a city was provided by the user, attempt to fetch current weather for that city
        // This ensures frontend displays weather for the user's requested location rather than a backend default
        if (city) {
            try {
                // Geocode the city to lat/lon using Nominatim
                const geoResp = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: { format: 'json', q: city, limit: 1 }
                });
                const place = geoResp.data && geoResp.data[0];
                if (place && place.lat && place.lon) {
                    const lat = place.lat;
                    const lon = place.lon;

                    // Fetch weather from Open-Meteo
                    const weatherResp = await axios.get('https://api.open-meteo.com/v1/forecast', {
                        params: {
                            latitude: lat,
                            longitude: lon,
                            current_weather: true,
                            daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                            timezone: 'auto'
                        }
                    });

                    const w = weatherResp.data || {};
                    const current = w.current_weather || {};
                    const daily = w.daily || {};

                    weatherObj = {
                        city: city,
                        temperature: typeof current.temperature !== 'undefined' ? current.temperature : (predictionData.weather?.temperature || 0),
                        min_temp: Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : (predictionData.weather?.min_temp || 0),
                        max_temp: Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : (predictionData.weather?.max_temp || 0),
                        rain_prob: Array.isArray(daily.precipitation_probability_max) ? daily.precipitation_probability_max[0] : (predictionData.weather?.rain_prob || 0),
                        humidity: predictionData.weather?.humidity || null,
                        source: 'open-meteo'
                    };
                }
            } catch (err) {
                console.warn('Failed to fetch weather for city, using backend weather:', err);
                // keep backend-provided weatherObj
            }
        }
        console.log("Extracted weatherObj:", weatherObj); // Debug log

        const finalOutfitType = (manualOverride && String(manualOverride).trim()) || predictionData.predicted_class || predictionData.class || "Unknown";

        const resData = {
            ...predictionData,
            confidence: predictionData.confidence || 0,
            outfit_type: finalOutfitType,
            // Normalize weather fields
            temperature: weatherObj.temperature || weatherObj.current_temp || 0,
            rain_probability: weatherObj.rain_prob || weatherObj.daily_rain_prob || 0,
            humidity: weatherObj.humidity || 'Normal',
            weather_breakdown: weatherObj.breakdown || [],
            // Verdict
            outfit_verdict: weatherObj.verdict || predictionData.weather_verdict,
            final_verdict: weatherObj.verdict || predictionData.weather_verdict,
            // Lists
            suggested_alternatives: predictionData.suggested_alternatives || [],
            accessories: predictionData.accessories || [], // Model might return these
            rain_advice: predictionData.rain_advice || [],
            image_url: predictionData.image_url || predictionData.url
        };
        console.log("Processed resData:", resData); // Debug log

        // Logic for Confidence Bands
        const conf = resData.confidence;
        let confidenceLabel = 'Low Confidence';
        let confidenceColor = 'red';

        if (conf > 0.75) {
            confidenceLabel = 'Very Confident';
            confidenceColor = 'green';
        } else if (conf > 0.5) {
            confidenceLabel = 'Confident';
            confidenceColor = 'yellow';
        } else if (conf > 0.3) {
            confidenceLabel = 'Medium Confidence';
            confidenceColor = 'orange';
        }

        // Logic for Explainability (Why?)
        const reasons = [];
        if (resData.outfit_verdict) reasons.push(resData.outfit_verdict);

        // Always add weather context if available
        if (resData.temperature) {
            if (resData.temperature > 25) reasons.push(`Great for today's warm weather (${resData.temperature}°C)`);
            else if (resData.temperature < 15) reasons.push(`Suitable for cooler temps (${resData.temperature}°C)`);
            else reasons.push(`Good match for today's temperature (${resData.temperature}°C)`);
        }

        if (resData.rain_probability > 50) {
            reasons.push("Rain expected — water-resistant options recommended");
        } else if (resData.rain_probability < 20) {
            reasons.push("Clear skies expected");
        }

        // Fabric Tips
        let fabricTips = null;
        // Logic for Fabric Insights (Rule-based) since we might not get material_verdict
        const outfitTypeLower = (resData.outfit_type || '').toLowerCase();

        const FABRIC_RULES = {
            'saree': { title: 'Saree Fabric Insight', tip: 'Cotton is best for >25°C. Silk is great for cool evenings.' },
            'kurti': { title: 'Kurti Fabric Insight', tip: 'Breathable cotton blends recommended for daily wear.' },
            'shirt': { title: 'Shirt Fabric Insight', tip: 'Linen is breathable for summer; Oxford cloth for cooler days.' },
            't-shirt': { title: 'T-Shirt Insight', tip: '100% Cotton offers best breathability.' },
            'jacket': { title: 'Layering Insight', tip: 'Ensure insulation layers are breathable.' },
        };

        if (outfitTypeLower && FABRIC_RULES[outfitTypeLower]) {
            fabricTips = FABRIC_RULES[outfitTypeLower];
        } else if (outfitTypeLower) {
            fabricTips = { title: `${resData.outfit_type} Insight`, tip: 'Choose natural fibers for comfort in this weather.' };
        }

        // Accessories: Merge model predictions with travel pack suggestions if any
        // If model didn't return accessories, we can try to guess or leave empty. 
        // Currently relying on predictionData.accessories. 
        // Note: The User mentioned "accessories list should me returned". If backend /predict/guest doesn't return it, we might need a fallback.
        // Let's check travelData for accessories too.
        let accessoriesList = (resData.accessories || []).map(item => ({
            name: item,
            icon: item
        }));

        if (accessoriesList.length === 0 && travelData.packing_recommendation?.accessories) {
            accessoriesList = travelData.packing_recommendation.accessories.map(item => ({
                name: item,
                icon: item
            }));
        }

        // Transform backend response to match frontend UI components
        return {
            data: {
                outfitIncluded: true,
                image_url: resData.image_url,
                image_id: predictionData.id || predictionData.image_id, // Ensure we pass ID if available
                outfitType: resData.outfit_type,
                outfitScore: Math.round(conf * 100),
                confidenceLabel,
                confidenceColor,
                reasons,
                fabricTips,
                weather: {
                    temp: resData.temperature,
                    condition: (resData.rain_probability > 50) ? 'Rainy' : 'Clear',
                    isRainy: (resData.rain_probability > 50),
                    breakdown: (Array.isArray(resData.weather_breakdown) && resData.weather_breakdown.length > 0)
                        ? resData.weather_breakdown
                        : [
                            `Temperature: ${resData.temperature}°C`,
                            (resData.rain_probability > 50) ? 'Rainy Conditions' : 'No Rain Expected',
                            `Humidity: ${resData.humidity || 'Normal'}`
                        ]
                },
                verdict: resData.final_verdict || "Analysis Complete",
                verdictColor: (resData.final_verdict?.startsWith('✅') || conf > 0.5) ? 'green' : 'red',
                suggestions: (resData.suggested_alternatives || []).filter(s => s && !s.toLowerCase().includes('not recommended') && !s.toLowerCase().includes('null')),
                accessories: accessoriesList,
                packingList: [
                    ...(resData.rain_advice || []).map(advice => ({
                        item: 'Weather Tip',
                        reason: `${advice} (Rain prob: ${resData.rain_probability || 0}%)`
                    })),
                    // Use travelData for essentials
                    ...(travelData.packing_recommendation ?
                        Object.entries(travelData.packing_recommendation).flatMap(([category, items]) => {
                            if (category === 'accessories') return []; // handled above
                            return items.map(item => ({
                                item: item,
                                reason: category.charAt(0).toUpperCase() + category.slice(1)
                            }));
                        }) : []
                    ),
                    // Fallback for flat list
                    ...(travelData.suggested_clothes || []).map(item => ({
                        item: item,
                        reason: `Recommended for ${travelData.city || city}: ${travelData.temperature || resData.temperature}°C`
                    }))
                ]
            }
        };
    } catch (error) {
        console.error("Analysis failed:", error);
        throw error;
    }
};

// New dedicated prediction endpoint
// New dedicated prediction endpoints
// New dedicated prediction endpoints
export const predictGuest = async (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.city) formData.append('city', data.city);
    if (data.occasion) formData.append('occasion', data.occasion);
    if (data.material) formData.append('material', data.material);
    if (data.manual_outfit_type) formData.append('manual_outfit_type', data.manual_outfit_type);

    try {
        console.log("Calling /predict/guest...", Object.fromEntries(formData));
        // Guest endpoint returns prediction + advice immediately, no ID
        const response = await api.post('/predict/guest', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Guest prediction failed:", error);
        throw error;
    }
};

export const predictAuth = async (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.city) formData.append('city', data.city);
    if (data.occasion) formData.append('occasion', data.occasion);
    if (data.material) formData.append('material', data.material);
    if (data.manual_outfit_type) formData.append('manual_outfit_type', data.manual_outfit_type);

    try {
        console.log("Calling /predict/auth...", Object.fromEntries(formData));
        // Auth endpoint returns prediction + ID + saves to DB
        const response = await api.post('/predict/auth', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                // Authorization header is added by interceptor if token exists
            }
        });
        return response.data;
    } catch (error) {
        console.error("Auth prediction failed:", error);
        throw error;
    }
};

// Legacy support or alias if needed, but better to use specific ones
export const predictOutfit = async (data) => {
    // Check if data is just a file (legacy call style) or an object
    // If it's a File object (legacy), wrap it. 
    // BUT checking instance of File might be tricky across contexts, 
    // better to assume new calls pass object { file, city... }
    // If 'data' has a 'file' property, it's the object. If 'data' IS the file, we wrap it.

    let payload = data;
    if (data instanceof File || (data && !data.file)) {
        // Fallback for any old calls passing just file
        payload = { file: data };
    }

    const token = localStorage.getItem('token');
    if (token) {
        return predictAuth(payload);
    } else {
        return predictGuest(payload);
    }
};


export const submitFeedback = async (feedbackData) => {
    try {
        // Unified /feedback endpoint
        // Expects: { user_label, image_id (optional), weather_context (optional), model_output (optional) }
        const payload = {
            user_label: feedbackData.user_selected_category,
            // If we have an ID (auth user), send it
            image_id: feedbackData.image_id || null,
            // Send context to help training even if no ID
            weather_context: feedbackData.weather_context || {},
            model_output: {
                predicted_category: feedbackData.model_predicted_category,
                confidence: feedbackData.confidence
            }
        };

        console.log("Sending feedback:", payload);
        const response = await api.post('/feedback', payload);
        return response.data;
    } catch (error) {
        console.error("Feedback submission failed:", error);
        throw error;
    }
};

export const wardrobeAPI = {
    // Upload a new outfit image to Cloudinary (Predictions are handled separately if needed)
    uploadOutfit: async (file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        if (type) formData.append('type', type);

        try {
            console.log("Starting Cloudinary upload...");
            const response = await api.post('/wardrobe/upload-outfit', formData);
            if (response.data && response.data.image_url) {
                console.log("Upload success, Cloud URL:", response.data.image_url);
                return {
                    id: response.data.id || response.data.image_id, // Capture ID from backend
                    image_url: response.data.image_url,
                    prediction: response.data.prediction // Backend might return auto-detected category
                };
            }
            throw new Error("No image URL returned");
        } catch (error) {
            console.error("Cloud upload failed", error);
            throw error;
        }
    },

    // Save outfit metadata to backend DB
    saveOutfit: async (outfitData) => {
        try {
            // outfitData matches OutfitCreate schema: { image_url, category, color, occasion, notes }
            const response = await api.post('/wardrobe/save-outfit', outfitData);
            return response.data;
        } catch (error) {
            console.error("Failed to save outfit:", error);
            throw error;
        }
    },

    // Get all outfits for the logged-in user
    // Force explicit limit/skip to ensure backend defaults don't hide items
    // Get all outfits for the logged-in user
    // Force explicit limit/skip to ensure backend defaults don't hide items
    getAllOutfits: async (filters = {}) => {
        try {
            const defaultParams = { skip: 0, limit: 100 };
            // Strip undefined/null params to avoid backend filtering by 'undefined'
            const cleanParams = Object.fromEntries(
                Object.entries({ ...defaultParams, ...filters }).filter(([_, v]) => v != null && v !== '')
            );
            const response = await api.get('/wardrobe/outfits', { params: cleanParams });

            // Backend returns: { count: int, outfits: [...] }
            const items = response.data.outfits || [];

            return items.map(item => ({
                id: item.id || item._id,
                image_url: item.image_url,
                category: item.category || "Uncategorized",
                type: item.category || "Uncategorized",
                last_worn: item.last_worn_date, // Backend field is 'last_worn_date'
                wear_count: item.wear_count || 0, // Backend might not have this yet? Or logic driven
                worn_history: [], // Backend doesn't show history list in main view
                notes: item.notes || ""
            }));
        } catch (error) {
            console.error("Failed to fetch outfits:", error);
            return [];
        }
    },

    // Get single outfit
    getOutfit: async (id) => {
        try {
            const response = await api.get(`/wardrobe/outfit/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to get outfit:", error);
            return null;
        }
    },

    // Delete outfit
    deleteOutfit: async (id) => {
        try {
            await api.delete(`/wardrobe/outfit/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Failed to delete outfit:", error);
            throw error;
        }
    },

    // Mark outfit as worn
    wearOutfit: async (id) => {
        try {
            const response = await api.post(`/wardrobe/wear-outfit/${id}`);
            // Returns { message, outfit } or { success, ... }
            return { success: true, outfit: response.data.outfit };
        } catch (error) {
            console.error("Failed to wear outfit:", error);
            throw error;
        }
    },

    // Get outfits by date
    getOutfitsByDate: async (dateStr) => {
        try {
            // Use dedicated endpoint: /wardrobe/outfits-by-date/YYYY-MM-DD
            const formattedDate = new Date(dateStr).toISOString().split('T')[0];
            const response = await api.get(`/wardrobe/outfits-by-date/${formattedDate}`);

            // Backend returns: { date: "...", count: N, outfits: [...] }
            const items = response.data.outfits || [];

            return items.map(item => ({
                id: item.id,
                image_url: item.image_url,
                category: item.category,
                type: item.category,
                last_worn: item.last_worn_date,
                wear_count: 0, // Not provided in history view usually
                notes: item.notes
            }));
        } catch (error) {
            // 404 might mean no items found for date
            if (error.response?.status === 404) return [];
            console.error("Failed to fetch outfits by date:", error);
            return [];
        }
    },

    // Get stats
    getStats: async () => {
        try {
            const response = await api.get('/wardrobe/stats');
            return response.data;
        } catch (error) {
            console.error("Failed to get stats:", error);
            return { total_items: 0, worn_today: 0 }; // Fallback
        }
    },

    getSuggestions: async (filters) => {
        try {
            const response = await api.get('/wardrobe/suggest-outfits', { params: filters });
            // Backend returns { count, outfits: [] }
            return response.data.outfits || [];
        } catch (error) {
            console.error("Failed to get suggestions:", error);
            return [];
        }
    }
};

export const authAPI = {
    login: async (email, password) => {
        // Using axios directly to avoid interceptor issues on login (though header doesn't hurt)
        // Better to use the 'api' instance but login creates the token, so it initially won't have one
        const response = await api.post('/auth/login', {
            email: email,
            password: password
        });

        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },

    register: async (email, password) => {
        const response = await api.post('/auth/register', {
            email: email,
            password: password
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
    },

    getToken: () => {
        return localStorage.getItem('token');
    }
};

// Fetch site metrics (read-only)
export const getMetrics = async () => {
    try {
        const response = await api.get('/metrics');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch metrics:', error);
        throw error;
    }
};
