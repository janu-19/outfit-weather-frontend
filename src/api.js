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

export const analyzeOutfit = async (formData) => {
    const data = new FormData();
    data.append('file', formData.file);
    data.append('city', formData.city);
    if (formData.occasion) {
        data.append('occasion', formData.occasion);
    }

    try {
        const [weatherResponse, travelResponse] = await Promise.all([
            api.post('/outfit-weather', data, {
                params: {
                    city: formData.city,
                    occasion: formData.occasion,
                    material: formData.material,
                    manual_outfit_type: formData.manual_outfit_type // Added manual input support
                },
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            api.get('/travel-pack', {
                params: { city: formData.city }
            }).catch(err => {
                console.warn("Travel pack fetch failed", err);
                return { data: { suggested_clothes: [] } };
            })
        ]);

        const resData = weatherResponse.data;
        const travelData = travelResponse.data;

        // Logic for Confidence Bands
        const conf = resData.confidence || 0;
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
        if (resData.material_verdict) reasons.push(resData.material_verdict);
        if (resData.material_reason) reasons.push(resData.material_reason);

        if (reasons.length === 0) {
            if (resData.temperature) reasons.push(`Temperature is ${resData.temperature}°C`);
            if (resData.rain_probability < 20) reasons.push("No rain expected");
            else if (resData.rain_probability > 50) reasons.push("Rain expected - waterproofs needed");
        }

        // Fabric Tips
        let fabricTips = null;
        if (resData.material_verdict) {
            fabricTips = {
                title: `Material Insight: ${resData.material || 'Selected Fabric'}`,
                tip: resData.material_verdict
            };
        } else {
            // Logic for Fabric Insights (Rule-based)
            const outfitTypeLower = (resData.outfit_type || '').toLowerCase();

            const FABRIC_RULES = {
                'saree': { title: 'Saree Fabric Insight', tip: 'Cotton is best for >25°C. Silk is great for cool evenings.' },
                'kurti': { title: 'Kurti Fabric Insight', tip: 'Breathable cotton blends recommended for daily wear.' },
                'shirt': { title: 'Shirt Fabric Insight', tip: 'Linen is breathable for summer; Oxford cloth for cooler days.' },
                't-shirt': { title: 'T-Shirt Insight', tip: '100% Cotton offers best breathability.' },
                'jacket': { title: 'Layering Insight', tip: 'Ensure insulation layers are breathable.' },
                // default fallback handled below
            };

            if (outfitTypeLower && FABRIC_RULES[outfitTypeLower]) {
                fabricTips = FABRIC_RULES[outfitTypeLower];
            } else if (outfitTypeLower) {
                fabricTips = { title: `${resData.outfit_type} Insight`, tip: 'Choose natural fibers for comfort in this weather.' };
            }
        }

        // Transform backend response to match frontend UI components
        return {
            data: {
                outfitIncluded: true,
                image_url: resData.image_url || resData.url, // Map image_url from backend response
                outfitType: resData.outfit_type,
                outfitScore: Math.round(conf * 100),
                confidenceLabel, // New field
                confidenceColor, // New field
                reasons, // New field for explainability
                fabricTips, // New field
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
                verdict: resData.final_verdict || resData.verdict || "Analysis Complete",
                verdictColor: (resData.final_verdict?.startsWith('✅') || conf > 0.5) ? 'green' : 'red',
                suggestions: (resData.suggested_alternatives || []).filter(s => s && !s.toLowerCase().includes('not recommended') && !s.toLowerCase().includes('null')),
                accessories: (resData.accessories || []).map(item => ({
                    name: item,
                    icon: item
                })),
                packingList: [
                    ...(resData.rain_advice || []).map(advice => ({
                        item: 'Weather Tip',
                        reason: `${advice} (Rain prob: ${resData.rain_probability || 0}%)`
                    })),
                    ...(resData.travel_essentials || []).map(item => ({
                        item: item,
                        reason: "Travel Essential"
                    })),
                    // New structured packing recommendations
                    ...(travelData.packing_recommendation ?
                        Object.entries(travelData.packing_recommendation).flatMap(([category, items]) =>
                            items.map(item => ({
                                item: item,
                                reason: category.charAt(0).toUpperCase() + category.slice(1)
                            }))
                        ) : []
                    ),
                    // Fallback for flat list
                    ...(travelData.suggested_clothes || []).map(item => ({
                        item: item,
                        reason: `Recommended for ${travelData.city}: ${travelData.temperature}°C`
                    }))
                ]
            }
        };
    } catch (error) {
        console.error("API call failed:", error);
        throw error;
    }
};

// New dedicated prediction endpoint
export const predictOutfit = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        console.log("Calling /predict-outfit...");
        const response = await api.post('/predict-outfit', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("Prediction success:", response.data);
        // Expects: { id, predicted_class, confidence, image_url, ... }
        return response.data;
    } catch (error) {
        console.error("Prediction failed:", error);
        throw error;
    }
};


export const submitFeedback = async (feedbackData) => {
    try {
        // Backend expects VerifyRequest: { image_id: int, user_label: str }
        // We map frontend data to this schema
        const payload = {
            image_id: feedbackData.image_id,
            user_label: feedbackData.user_selected_category
        };

        console.log("Sending verification:", payload);
        const response = await api.post('/verify-outfit', payload);
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
