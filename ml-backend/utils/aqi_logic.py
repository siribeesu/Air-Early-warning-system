import math

# --- Region detection helpers ---

_SOUTH_ASIA = [
    'delhi', 'new delhi', 'mumbai', 'kolkata', 'chennai', 'bangalore', 'bengaluru',
    'hyderabad', 'pune', 'ahmedabad', 'lucknow', 'kanpur', 'agra', 'varanasi',
    'jaipur', 'patna', 'surat', 'nagpur', 'noida', 'gurugram', 'gurgaon',
    'india', 'pakistan', 'lahore', 'karachi', 'islamabad', 'dhaka', 'bangladesh',
    'nepal', 'kathmandu', 'colombo', 'sri lanka'
]
_EAST_ASIA = [
    'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'wuhan', 'chengdu', 'xian',
    'tianjin', 'china', 'seoul', 'busan', 'korea', 'tokyo', 'osaka', 'nagoya',
    'japan', 'taipei', 'taiwan'
]
_SOUTHEAST_ASIA = [
    'bangkok', 'chiang mai', 'jakarta', 'bandung', 'manila', 'singapore',
    'kuala lumpur', 'petaling jaya', 'hanoi', 'ho chi minh', 'saigon',
    'yangon', 'myanmar', 'thailand', 'indonesia', 'malaysia', 'philippines',
    'vietnam', 'cambodia', 'phnom penh'
]
_MIDDLE_EAST = [
    'dubai', 'abu dhabi', 'riyadh', 'jeddah', 'doha', 'kuwait city',
    'muscat', 'tehran', 'saudi arabia', 'uae', 'qatar', 'kuwait',
    'oman', 'iran', 'iraq', 'baghdad'
]
_AFRICA = [
    'cairo', 'lagos', 'nairobi', 'addis ababa', 'accra', 'dakar', 'kinshasa',
    'egypt', 'nigeria', 'kenya', 'ethiopia', 'ghana', 'senegal', 'south africa',
    'johannesburg', 'cape town', 'casablanca', 'morocco', 'algeria'
]


def _detect_region(location_name):
    loc = location_name.lower()
    if any(k in loc for k in _SOUTH_ASIA):
        return 'south_asia'
    if any(k in loc for k in _EAST_ASIA):
        return 'east_asia'
    if any(k in loc for k in _SOUTHEAST_ASIA):
        return 'southeast_asia'
    if any(k in loc for k in _MIDDLE_EAST):
        return 'middle_east'
    if any(k in loc for k in _AFRICA):
        return 'africa'
    return 'general'


def _dominant_pollutant(components):
    """Returns the name of the dominant pollutant based on how much it exceeds its safe limit."""
    pm25 = components.get('pm2_5', components.get('pm25', 0)) or 0
    pm10 = components.get('pm10', 0) or 0
    no2  = components.get('no2', 0) or 0
    o3   = components.get('o3', 0) or 0
    co   = components.get('co', 0) or 0

    # Normalise each pollutant against its primary safe limit
    scores = {
        'PM2.5': pm25 / 12.0,     # WHO 24-h guideline: 15 µg/m³, EPA Good: <12
        'PM10':  pm10 / 54.0,     # EPA Good: <54
        'NO2':   no2  / 40.0,     # WHO annual guideline: 40 µg/m³ ≈ 21 ppb; moderate ~40 ppb
        'Ozone': o3   / 70.0,     # EPA moderate: 70 ppb
        'CO':    co   / 1000.0    # Elevated: >1000 µg/m³
    }
    return max(scores, key=scores.get) if any(v > 0 for v in scores.values()) else 'General'


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def get_aqi_category(aqi):
    """Categorises AQI using US EPA breakpoints."""
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    if aqi <= 300:  return "Very Unhealthy"
    return "Hazardous"


def generate_health_tip(aqi, components=None, location_name=""):
    """
    Region-aware, pollutant-specific health recommendations.

    Considers:
    - AQI severity bracket
    - Dominant pollutant (PM2.5, NO2, Ozone, CO …)
    - Geographic region (South Asia, East Asia, Middle East, etc.)
    """
    components = components or {}
    category = get_aqi_category(aqi)
    region   = _detect_region(location_name)
    dominant = _dominant_pollutant(components)

    pm25 = components.get('pm2_5', components.get('pm25', 0)) or 0
    o3   = components.get('o3', 0) or 0
    no2  = components.get('no2', 0) or 0
    co   = components.get('co', 0) or 0

    # ── Good (0–50) ──────────────────────────────────────────────────────────
    if aqi <= 50:
        if region == 'south_asia':
            tip = (
                "Air quality is satisfactory today. A great morning for outdoor yoga, "
                "cycling, or a walk in the park. Children can play outside freely."
            )
        elif region in ('east_asia', 'southeast_asia'):
            tip = (
                "Excellent air quality. Safe for all outdoor activities including "
                "strenuous exercise. Enjoy the clear atmosphere."
            )
        else:
            tip = (
                "Air quality is ideal. Enjoy outdoor activities without restriction. "
                "No protective measures are necessary."
            )

    # ── Moderate (51–100) ────────────────────────────────────────────────────
    elif aqi <= 100:
        if dominant == 'PM2.5' and pm25 > 15:
            tip = (
                f"Fine particulate matter (PM2.5: {round(pm25, 1)} µg/m³) is slightly elevated. "
                "Sensitive individuals — children, elderly, and those with asthma or heart conditions — "
                "should limit prolonged outdoor exertion."
            )
        elif dominant == 'Ozone' and o3 > 50:
            tip = (
                f"Ground-level ozone is elevated ({round(o3, 1)} ppb). Avoid outdoor exercise "
                "between 12 PM – 6 PM when ozone peaks. Morning or evening activity is safer."
            )
        elif dominant == 'NO2' and no2 > 25:
            tip = (
                f"Nitrogen dioxide from traffic is elevated ({round(no2, 1)} ppb). "
                "Avoid exercising directly alongside busy roads. Cycling or walking on back streets is safer."
            )
        else:
            if region == 'south_asia':
                tip = (
                    "Air quality is moderate. Healthy individuals can continue normal outdoor activities. "
                    "Sensitive groups should consider wearing an N95 mask for prolonged outdoor stays."
                )
            elif region == 'middle_east':
                tip = (
                    "Moderate air quality, possibly due to dust particles. Stay hydrated and "
                    "limit strenuous outdoor activity during the hottest part of the day."
                )
            else:
                tip = (
                    "Acceptable air quality. Unusually sensitive people should consider "
                    "reducing prolonged or heavy outdoor exertion."
                )

    # ── Unhealthy for Sensitive Groups (101–150) ─────────────────────────────
    elif aqi <= 150:
        if region == 'south_asia':
            if dominant == 'PM2.5':
                tip = (
                    f"PM2.5 is hazardous for sensitive groups ({round(pm25, 1)} µg/m³). "
                    "Wear a certified N95 or KN95 mask outdoors. Keep windows closed and run "
                    "air purifiers indoors. Avoid morning outdoor walks — pollution is typically "
                    "highest between 6–9 AM and 5–8 PM."
                )
            elif dominant == 'NO2':
                tip = (
                    "Heavy vehicular NO2 pollution detected. Avoid peak traffic hours (8–10 AM, 5–8 PM). "
                    "Use public transport instead of private vehicles. Sensitive groups should stay indoors."
                )
            else:
                tip = (
                    "Unhealthy air quality for sensitive groups. Children, elderly, and people with "
                    "asthma or heart disease should remain indoors. If no air purifier is available, "
                    "seal window gaps with wet cloth to reduce particulate infiltration."
                )
        elif region in ('east_asia', 'southeast_asia'):
            tip = (
                "Wear a certified PM2.5-rated mask (KF94 / N95) for outdoor activity. "
                "Run air purifiers at medium setting indoors. Sensitive groups should postpone "
                "outdoor exercise to when AQI improves."
            )
        elif region == 'middle_east':
            tip = (
                "Dust and pollutant levels are elevated. Avoid outdoor activity during sandstorm "
                "conditions. Wear a mask that covers nose and mouth outdoors. Keep car windows closed."
            )
        else:
            tip = (
                "People with heart or lung disease, older adults, and children should reduce "
                "heavy outdoor exertion. Others should consider limiting prolonged outdoor activity."
            )

    # ── Unhealthy (151–200) ──────────────────────────────────────────────────
    elif aqi <= 200:
        if region == 'south_asia':
            tip = (
                "UNHEALTHY — Do not allow children to play outdoors. Adults must wear N95/KN95 masks "
                "even for brief outdoor trips. Run air purifiers on the highest setting. "
                "Drinking warm water with honey and ginger can help soothe irritated airways. "
                "Close all windows and avoid outdoor cooking or burning."
            )
        elif region in ('east_asia', 'southeast_asia'):
            tip = (
                "Severe pollution. Wear N95 or equivalent masks outdoors. Limit all non-essential "
                "outdoor activity. Run air purifiers continuously indoors. Avoid opening windows."
            )
        else:
            tip = (
                "Everyone should reduce outdoor exertion. Active children and adults, and people with "
                "respiratory or cardiovascular conditions, should avoid all outdoor activity."
            )

    # ── Very Unhealthy (201–300) ─────────────────────────────────────────────
    elif aqi <= 300:
        if region == 'south_asia':
            tip = (
                "VERY UNHEALTHY EMERGENCY — Shelter indoors immediately. Seal door and window gaps "
                "with wet towels. Avoid using gas stoves; switch to induction cooking to reduce "
                "indoor pollution. Schools should declare an emergency holiday. "
                "Anyone outdoors must wear N95+ mask. Seek medical attention if experiencing "
                "chest tightness, coughing fits, or difficulty breathing."
            )
        else:
            tip = (
                "Health alert: Everyone may experience serious health effects. Avoid all outdoor activity. "
                "Keep windows tightly sealed, run air purifiers continuously, and monitor for symptoms "
                "such as shortness of breath, chest pain, or persistent coughing."
            )

    # ── Hazardous (300+) ─────────────────────────────────────────────────────
    else:
        if region == 'south_asia':
            tip = (
                "HAZARDOUS EMERGENCY — Do NOT go outdoors under any circumstances. Seal all windows "
                "and doors. Run multiple air purifiers on maximum. Avoid any physical exertion indoors. "
                "Call emergency services immediately if experiencing difficulty breathing, chest pain, "
                "or extreme dizziness. This is a public health emergency."
            )
        else:
            tip = (
                "HAZARDOUS CONDITIONS — Remain indoors with continuous air filtration. The entire "
                "population is at serious risk. Seek emergency medical care if experiencing "
                "respiratory distress, chest pain, or confusion."
            )

    return {"category": category, "recommendation": tip}


def check_for_alerts(predicted_aqi, current_aqi):
    """Early warning system alerts based on predicted 6-hour AQI trajectory."""
    alerts = []
    future_cat   = get_aqi_category(predicted_aqi)
    current_cat  = get_aqi_category(current_aqi)

    if predicted_aqi > 200:
        alerts.append({
            "severity": "CRITICAL",
            "title": "Hazardous Conditions Approaching",
            "message": (
                f"AQI is predicted to reach {predicted_aqi:.1f} ({future_cat}) within 6 hours. "
                "Shelter indoors immediately and seal windows."
            )
        })
    elif predicted_aqi > 150:
        alerts.append({
            "severity": "CRITICAL",
            "title": "Unhealthy Air Quality Predicted",
            "message": (
                f"AQI forecast: {predicted_aqi:.1f} ({future_cat}) in the next 6 hours. "
                "Sensitive groups should move indoors now."
            )
        })
    elif predicted_aqi > 100 and predicted_aqi > current_aqi + 20:
        alerts.append({
            "severity": "WARNING",
            "title": "Rapid Air Quality Deterioration",
            "message": (
                f"AQI is climbing from {current_aqi:.1f} → {predicted_aqi:.1f} within 6 hours "
                f"(+{predicted_aqi - current_aqi:.1f} points). Sensitive groups should limit outdoor exposure."
            )
        })
    elif predicted_aqi <= 50 and current_aqi > 100:
        alerts.append({
            "severity": "INFO",
            "title": "Conditions Improving",
            "message": (
                f"Pollution is dispersing. AQI expected to drop to {predicted_aqi:.1f} ({future_cat}) shortly. "
                "Outdoor activities will become safe again."
            )
        })
    elif current_aqi > current_aqi * 0.9 and current_aqi <= 50:
        # Stay-good notice
        alerts.append({
            "severity": "INFO",
            "title": "Clean Air Maintained",
            "message": (
                f"Air quality remains Good (AQI {current_aqi:.1f}). "
                "Excellent conditions for outdoor activity are expected to continue."
            )
        })

    return alerts


def generate_daily_guide(aqi, components, location_name=""):
    """
    Intelligent, region-aware Government Directives.
    Analyses pollutant fingerprints and geographic context to produce
    actionable, society-level policy suggestions for authorities.
    """
    directives = []
    region = _detect_region(location_name)

    no2  = components.get('no2', 0) or 0
    pm25 = components.get('pm2_5', components.get('pm25', 0)) or 0
    pm10 = components.get('pm10', 0) or 0
    so2  = components.get('so2', 0) or 0
    o3   = components.get('o3', 0) or 0
    co   = components.get('co', 0) or 0

    # Atmospheric fingerprinting
    is_photochemical_smog  = (no2 > 40 or o3 > 100)
    is_industrial_burn     = (pm25 > 35 and so2 > 20)
    is_urban_dust          = (pm10 > 50 and pm10 > pm25 * 2)
    is_winter_inversion    = (co > 800 and pm25 > 50)
    is_crop_burning        = (pm25 > 60 and co > 600 and region == 'south_asia')

    # ── Good (0–50) ──────────────────────────────────────────────────────────
    if aqi <= 50:
        directives.append({
            "type": "policy",
            "title": "Sustain Green Compliance",
            "text": (
                "Atmospheric equilibrium achieved. Issue operational tax rebates to green-certified "
                "industrial sectors to reinforce long-term compliance."
            )
        })
        if region == 'south_asia':
            directives.append({
                "type": "authority",
                "title": "EV Transition Incentive Window",
                "text": (
                    "Optimal conditions to expand the Electric Vehicle subsidy scheme. "
                    "Announce additional FAME-II incentives and fast-track charging infrastructure approvals."
                )
            })
        else:
            directives.append({
                "type": "authority",
                "title": "Permit Acceleration Window",
                "text": (
                    "Low-risk window: approve pending industrial or construction permits "
                    "without risking ecological tipping points."
                )
            })

    # ── Moderate (51–100) ────────────────────────────────────────────────────
    elif aqi <= 100:
        if is_crop_burning:
            directives.append({
                "type": "regulation",
                "title": "Stubble Burning Enforcement",
                "text": (
                    "Satellite data indicates crop-residue burning in the region. Deploy district-level "
                    "agricultural officers to enforce the stubble-burning ban. Offer incentives for "
                    "happy-seeder machine use."
                )
            })
        elif is_photochemical_smog:
            directives.append({
                "type": "regulation",
                "title": "Transit Demand Management",
                "text": (
                    "Photochemical smog building up. Temporarily raise toll prices on arterial highways "
                    "during peak hours to reduce non-essential private-vehicle traffic."
                )
            })
        elif is_urban_dust:
            directives.append({
                "type": "policy",
                "title": "Dust Suppression Ordinance",
                "text": (
                    "Elevated coarse particulates detected. Mandate municipal water-misting trucks on "
                    "commercial corridors and enforce compulsory construction-site dust-netting."
                )
            })
        else:
            directives.append({
                "type": "regulation",
                "title": "Routine Compliance Audit",
                "text": (
                    "Minor atmospheric degradation detected. Deploy mobile inspection units to "
                    "industrial zones to verify baseline filtration and emission standards."
                )
            })

    # ── Unhealthy for Sensitive Groups (101–150) ─────────────────────────────
    elif aqi <= 150:
        if is_crop_burning:
            directives.append({
                "type": "policy",
                "title": "Stubble Burning Emergency Ban",
                "text": (
                    "Active crop-residue smoke signatures detected. Invoke IPC Section 188 against "
                    "farmers caught burning. Offer next-day compensation for crop-residue collection."
                )
            })
        elif is_industrial_burn:
            directives.append({
                "type": "policy",
                "title": "Stack Throttling Order",
                "text": (
                    "Sulfur and heavy particulate signatures indicate industrial outflow. "
                    "Enforce immediate 20% output reduction for Tier-1 manufacturing and refinery plants."
                )
            })
        elif is_photochemical_smog:
            directives.append({
                "type": "policy",
                "title": "Electric Fleet Mandate",
                "text": (
                    "High NO2 concentration from vehicular combustion. Mandate that all municipal "
                    "public transit shifts to electric reserves. Suspend diesel bus operations immediately."
                )
            })
        elif is_winter_inversion:
            directives.append({
                "type": "policy",
                "title": "Thermal Capping Order",
                "text": (
                    "CO trapping from heating emissions identified. Restrict solid-fuel heating in "
                    "residential zones and subsidise electric heating alternatives."
                )
            })
        else:
            directives.append({
                "type": "regulation",
                "title": "Vehicular Emission Checks",
                "text": (
                    "Elevated AQI warrants targeted enforcement. Set up surprise vehicle emission check "
                    "posts on key arterials and impound non-compliant commercial vehicles."
                )
            })
        directives.append({
            "type": "authority",
            "title": "Vulnerable Group Advisory",
            "text": (
                "Issue formal advisories to schools, hospitals, and senior care facilities to keep "
                "sensitive populations indoors. Prepare for a 15–20% increase in respiratory clinic visits."
            )
        })

    # ── Unhealthy (151–250) ──────────────────────────────────────────────────
    elif aqi <= 250:
        if region == 'south_asia':
            directives.append({
                "type": "policy",
                "title": "Odd-Even Vehicular Rationing",
                "text": (
                    "Critical vehicular emission levels. Enforce immediate Odd-Even licence-plate "
                    "rationing within the city's core urban radius. Exempt emergency vehicles, "
                    "women travelling alone, and school buses."
                )
            })
            if is_industrial_burn or is_winter_inversion:
                directives.append({
                    "type": "policy",
                    "title": "Industrial Output Halt",
                    "text": (
                        "Toxic particulate accumulation is unsustainable. Issue GRAP Stage-III orders: "
                        "halt brick kilns, hot-mix plants, and stone crushers. Close all construction "
                        "activities that generate dust."
                    )
                })
        else:
            if is_photochemical_smog:
                directives.append({
                    "type": "policy",
                    "title": "Congestion Charge Emergency Tier",
                    "text": (
                        "Critical traffic emissions. Triple congestion-charge rates in the city centre "
                        "and introduce a temporary ban on non-essential diesel HGVs."
                    )
                })
            if is_industrial_burn:
                directives.append({
                    "type": "policy",
                    "title": "Rolling Industrial Curtailment",
                    "text": (
                        "Trigger rolling power-throttling to industrial sectors exceeding 400 MWh "
                        "hourly draw. Non-essential heavy industry must reduce output by 40%."
                    )
                })
        directives.append({
            "type": "authority",
            "title": "Mandatory Remote Work Directive",
            "text": (
                "Transition 50% of non-essential government and private workforce to remote operations "
                "to drastically cut commuter transit load."
            )
        })

    # ── Hazardous (250+) ─────────────────────────────────────────────────────
    else:
        if region == 'south_asia':
            directives.append({
                "type": "authority",
                "title": "GRAP Stage-IV Emergency",
                "text": (
                    "Invoke GRAP Stage-IV: mandatory closure of all schools, colleges, and government "
                    "offices. Ban all construction, mining, and demolition activities. "
                    "Activate civil defence teams to distribute N95 masks at community centres."
                )
            })
            directives.append({
                "type": "policy",
                "title": "Complete Commercial Halt",
                "text": (
                    "Declare a 48-hour non-essential commercial shutdown. Restrict LPG and CNG "
                    "distribution to emergency vehicles only. Issue shelter-in-place orders "
                    "for the entire civilian population."
                )
            })
        else:
            directives.append({
                "type": "authority",
                "title": "Tier-1 State of Emergency",
                "text": (
                    "Atmosphere is critically toxic. Enact mandatory shelter-in-place protocols. "
                    "Emergency alert system activation across all public channels."
                )
            })
            directives.append({
                "type": "policy",
                "title": "Complete Societal Halt",
                "text": (
                    "Full cessation of all commercial, industrial, and non-emergency logistics "
                    "within the affected grid until AQI drops below 200."
                )
            })
        directives.append({
            "type": "regulation",
            "title": "Zero-Tolerance Industrial Seizure",
            "text": (
                "Authorise ecological enforcement agencies to immediately seize and shut down "
                "any industrial plant violating the emergency blackout order, with no advance warning."
            )
        })

    return directives[:3]


def generate_long_term_projection(aqi, components, forecast_data, city_name="Current Location"):
    """
    Calculates atmospheric degradation milestones using historical growth ratios
    and short-term emission velocity derived from the 7-day forecast.
    """
    # Base annual compound growth — ordered correctly (most severe first)
    if aqi > 250:
        base_growth_ratio = 0.12
    elif aqi > 150:
        base_growth_ratio = 0.08
    elif aqi > 100:
        base_growth_ratio = 0.05
    else:
        base_growth_ratio = 0.03

    # Short-term velocity from 24h forecast trend
    hourly_data = forecast_data.get('hourly', [])
    if hourly_data and len(hourly_data) >= 6:
        last_aqi  = hourly_data[-1]['aqi'] if hourly_data[-1]['aqi'] is not None else aqi
        trend_aqi = hourly_data[5]['aqi']  if hourly_data[5]['aqi']  is not None else aqi
        short_term_velocity = ((trend_aqi - aqi) / aqi) if aqi > 0 else 0
    else:
        short_term_velocity = 0.001

    # Combined annual velocity (Dampened for realism)
    # We treat the short-term trend as a minor modifier (5% weight) to the base ratio
    # to avoid extreme volatility from 24h weather changes.
    trend_modifier = max(-0.05, min(0.05, short_term_velocity * 0.05))
    annual_velocity = base_growth_ratio + trend_modifier
    
    # Final Safety Bounds: -5% to +20% annual growth
    annual_velocity = max(-0.05, min(0.20, annual_velocity))
    
    monthly_velocity = annual_velocity / 12

    milestones = [
        {"period": "1 Month",  "aqi": round(aqi * (1 + monthly_velocity) ** 1)},
        {"period": "3 Months", "aqi": round(aqi * (1 + monthly_velocity) ** 3)},
        {"period": "6 Months", "aqi": round(aqi * (1 + monthly_velocity) ** 6)},
        {"period": "1 Year",   "aqi": round(aqi * (1 + annual_velocity)  ** 1)},
    ]

    # Days until AQI > 200 (toxic tipping point)
    days_to_spoiled = "N/A"
    if annual_velocity > 0 and aqi > 0:
        daily_r = annual_velocity / 365
        if aqi < 200:
            try:
                days_to_spoiled = round(math.log(200 / aqi) / math.log(1 + daily_r))
            except Exception:
                days_to_spoiled = 999
        else:
            days_to_spoiled = 0

    for m in milestones:
        m["aqi"]    = max(0, min(500, m["aqi"]))
        m["status"] = "Safe" if m["aqi"] < 100 else ("Poor" if m["aqi"] < 200 else "Toxic")

    risk_level = (
        "High"     if annual_velocity > 0.08 else
        "Moderate" if annual_velocity > 0.03 else
        "Low"
    )

    return {
        "milestones":         milestones,
        "days_to_spoiled":    days_to_spoiled,
        "growth_ratio":       f"{round(annual_velocity * 100, 1)}%",
        "tipping_point_desc": (
            f"Critical threshold (AQI 200) projected in ~{days_to_spoiled} days"
            if isinstance(days_to_spoiled, int) and days_to_spoiled > 0
            else "Tipping point already exceeded."
        ),
        "risk_level": risk_level
    }


def get_emission_sources(aqi, components):
    """Estimates local emission source distribution from real-time pollutant fingerprints."""
    sources = [
        {"name": "TRANSPORTATION", "value": 40, "color": "var(--primary-color)"},
        {"name": "INDUSTRIAL",     "value": 25, "color": "#6366f1"},
        {"name": "ENERGY/HEATING", "value": 20, "color": "#f59e0b"},
        {"name": "CONSTRUCTION",   "value": 15, "color": "#10b981"}
    ]

    no2  = components.get('no2', 0) or 0
    pm25 = components.get('pm2_5', components.get('pm25', 0)) or 0
    pm10 = components.get('pm10', 0) or 0
    co   = components.get('co', 0) or 0
    o3   = components.get('o3', 0) or 0
    so2  = components.get('so2', 0) or 0

    if no2 > 30 or co > 500:
        sources[0]["value"] += 20
        sources[1]["value"] -= 10

    if so2 > 10:
        sources[1]["value"] += 15
        sources[2]["value"] += 5
        sources[0]["value"] -= 10

    if pm10 > pm25 * 2 and pm10 > 40:
        sources[3]["value"] += 15
        sources[0]["value"] -= 10

    if co > 1000 and o3 < 20:
        sources[2]["value"] += 20
        sources[0]["value"] -= 10

    for s in sources:
        s["value"] = max(5, s["value"])

    total = sum(s["value"] for s in sources)
    for s in sources:
        s["value"] = round((s["value"] / total) * 100)

    max_source = max(sources, key=lambda x: x["value"])
    note = "Atmospheric data indicates stable local dispersion within expected parameters."

    if aqi > 50:
        notes = {
            "TRANSPORTATION":  "Combustion-related particles are elevated. Traffic density is the primary contributor.",
            "INDUSTRIAL":      "Chemical signatures suggest industrial outflow. Wind direction may be carrying particulates from nearby facilities.",
            "CONSTRUCTION":    "High coarse particle count detected, likely from local construction or ground disturbance.",
            "ENERGY/HEATING":  "Elevated carbon signatures point toward local power generation or residential heating activity."
        }
        note = notes.get(max_source["name"], note)

    return {"breakdown": sources, "note": note}
