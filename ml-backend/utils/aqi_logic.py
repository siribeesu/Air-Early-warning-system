def get_aqi_category(aqi):
    """
    Categorizes AQI based on EPA standard guidelines.
    """
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

def generate_health_tip(aqi):
    """
    Produces actionable health recommendations mapped directly to the AQI category.
    """
    category = get_aqi_category(aqi)
    
    tips = {
        "Good": "Air quality is considered satisfactory. Enjoy your normal outdoor activities.",
        "Moderate": "Unusually sensitive people should consider reducing prolonged or heavy exertion outdoors.",
        "Unhealthy for Sensitive Groups": "People with heart or lung disease, older adults, and children should reduce heavy outdoor exertion.",
        "Unhealthy": "Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion.",
        "Very Unhealthy": "Active children and adults, and people with respiratory disease, such as asthma, should avoid all outdoor exertion; everyone else should avoid prolonged outdoor exertion.",
        "Hazardous": "Health warnings of emergency conditions. The entire population is more likely to be affected. Avoid all outdoor physical activity."
    }
    
    return {"category": category, "recommendation": tips.get(category, "Stay indoors and consult local guidelines.")}

def check_for_alerts(predicted_aqi, current_aqi):
    """
    Business logic for Early Warning System. Triggers alerts based on rapid changes
    or dangerous threshold crossings within the predictive horizon (6 hours).
    """
    alerts = []
    
    future_cat = get_aqi_category(predicted_aqi)
    current_cat = get_aqi_category(current_aqi)
    
    if predicted_aqi > 150:
        alerts.append({
            "severity": "CRITICAL",
            "title": "Hazardous Spike Predicted",
            "message": f"AQI is predicted to reach {predicted_aqi:.1f} ({future_cat}) in the next 6 hours. Limit outdoor exposure."
        })
    elif predicted_aqi > 100 and predicted_aqi > current_aqi + 20:
        alerts.append({
            "severity": "WARNING",
            "title": "Air Quality Deteriorating",
            "message": f"AQI is climbing from {current_aqi:.1f} to {predicted_aqi:.1f} within 6 hours. Monitor conditions."
        })
    elif predicted_aqi <= 50 and current_aqi > 100:
        alerts.append({
            "severity": "INFO",
            "title": "Clear Conditions Ahead",
            "message": f"Pollution levels are dispersing. Expected AQI {predicted_aqi:.1f} shortly."
        })
        
    return alerts
