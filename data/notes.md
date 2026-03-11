# Data Notes

This dataset contains realistic estimated travel costs from Newark, NJ to various New Jersey destinations for spring break trips, refreshed for March 2026.

## Source & Methodology

### Primary Sources (used for March 2026 estimates)

- **Lodging costs**: Aggregated spring break rates (mid-March peak season) from Booking.com, Expedia, and Airbnb search trends for Feb–Mar 2026.
  - Note: Spring break rates are typically 20–30% higher than off-season.
  - Urban/popular shore: $110–165/night
  - Quieter/outdoor areas: $105–130/night
  - Upscale destinations (Cape May, Long Beach Island): $155–165/night

- **Travel costs**: Based on current NJ Transit fares + AAA mileage reimbursement rate ($0.59/mi).
  - Round-trip NJ Transit bus (where available): $15–52
  - Personal car estimate (fuel + tolls): ~$0.50–0.60/mile roundtrip
  - Ranges: $18–52 depending on distance and mode

- **Food costs**: Student travel budgets from Project Time Off (2025 report) and typical boardwalk/casual dining.
  - Beach boardwalk areas: $58–70/day (pricier, tourist-focused)
  - Quieter areas: $48–60/day (more local, affordable options)

- **Activity costs**: Typical spring break attractions for NJ destinations.
  - Boardwalk/casino areas: $70–95 (rides, fees, entertainment)
  - Outdoor/nature areas: $25–60 (park fees, hiking, scenic access)
  - College towns: $40–50 (museum visits, local events)

## Caveats and Limitations

- Costs represent **averages for peak spring break season** and may vary by exact dates.
- Lodging assumes standard rooms; student hostels or RVs may be cheaper.
- Food budget assumes casual dining; can be reduced with groceries or meal plans.
- Activity costs are per-trip estimates; some attractions are free (beaches, parks).
- No consideration for last-minute bookings, group discounts, or multi-day packages.
- Personal student spending varies widely by preferences and group size.

## Live API Options for Future Integration

### Hotel & Lodging APIs

1. **Booking.com API** (Affiliate Program)
   - Free tier for developers; affiliate commission on bookings
   - Real-time availability, pricing, reviews
   - Endpoint: `https://api.booking.com/v1/`
   - Setup: https://partner.booking.com/

2. **Expedia API** (Partner Program)
   - Requires approval; offers hotel search and pricing
   - Supports filters by location, date, price
   - Setup: https://developer.expediagroup.com/

3. **Hotels.com API** (via Expedia partner)
   - Similar to Expedia, integrated partnership
   - Real-time rates and availability

4. **Google Hotels API** (via Google Travel)
   - Recently launched; limited APIs available
   - Integrates with Google Maps distance/travel time
   - Setup: https://developers.google.com/hotels/hotel-ads/

### Transportation & Distance APIs

- **Google Maps API**: Distance, duration, transit options from Newark to destinations
  - Endpoint: `https://maps.googleapis.com/maps/api/distance/json`
  - Pricing: ~$5–10/1000 requests

- **NJ Transit API**: Real-time bus, rail, and fare data
  - Limited public API availability; check https://www.njtransit.com/

### Implementation Strategy for Live Data

1. **Serverless approach** (recommended for budget apps):
   - Use Vercel Functions or AWS Lambda
   - Store API keys server-side (not in frontend)
   - Cache results (hotels don't change hourly; refresh daily)

2. **Client-side with CORS proxy**:
   - Use services like `cors-anywhere.herokuapp.com` (slow, limited)
   - Not recommended for production

3. **Build-time data fetch**:
   - Run a Node script during `npm run build` to fetch latest prices
   - Store in `processed.json` for deployment
   - Fastest approach; data refreshes on each deploy

## Future Improvements

- Integrate live Booking.com or Expedia API for real-time lodging prices
- Add Google Maps for dynamic distance calculations
- Support seasonal pricing (fall vs. spring vs. summer rates)
- Include reviews and ratings (Booking.com, Google)
- Add filter for hostel/budget lodging vs. hotels
- Track price trends over time