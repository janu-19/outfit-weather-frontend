import axios from 'axios';

const API_Base = 'https://outfit-weather-backend.onrender.com';

export const analyzeOutfit = async (formData) => {
    const data = new FormData();
    data.append('file', formData.file);
    data.append('city', formData.city);
    if (formData.occasion) {
        data.append('occasion', formData.occasion);
    }

    try {
        const [weatherResponse, travelResponse] = await Promise.all([
            axios.post(`${API_Base}/outfit-weather`, data, {
                params: {
                    city: formData.city,
                    occasion: formData.occasion,
                    material: formData.material
                },
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            axios.get(`${API_Base}/travel-pack`, {
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
