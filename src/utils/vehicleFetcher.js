import { chunk, groupBy } from "lodash-es";

/**
 * Fetches vehicle positions for predictions in batches of 10 (API limit).
 * Groups by agency and adds route color information from Sanity.
 *
 * @param {Array} predictions - Array of predictions with agencySlug and vid
 * @param {Array} allRoutes - Optional Sanity routes for color lookup
 * @returns {Promise<Array>} - Array of vehicles with agencySlug and route colors
 */
export async function fetchVehiclesBatched(predictions, allRoutes = []) {
  if (!predictions || predictions.length === 0) return [];

  const allVehicles = [];
  const predictionsByAgency = groupBy(predictions, "agencySlug");

  for (const [agencySlug, agencyPredictions] of Object.entries(predictionsByAgency)) {
    const vehicleIds = [...new Set(agencyPredictions.map((p) => p.vid).filter(Boolean))];
    if (vehicleIds.length === 0) continue;

    // Batch vehicle requests in groups of 10 (API limit)
    const vehicleBatches = chunk(vehicleIds, 10);

    for (const batch of vehicleBatches) {
      try {
        const response = await fetch(
          `/.netlify/functions/vehicle?vehicleIds=${batch.join(",")}&agency=${agencySlug}`
        );
        const data = await response.json();

        if (data["bustime-response"]?.vehicle) {
          const vehiclesWithInfo = data["bustime-response"].vehicle.map((v) => {
            const route = allRoutes.find(
              (r) => r.agency?.slug?.current === agencySlug && r.shortName === v.rt
            );
            return {
              ...v,
              agencySlug,
              routeColor: route?.color?.hex || "#666",
              routeTextColor: route?.textColor?.hex || "#fff",
            };
          });
          allVehicles.push(...vehiclesWithInfo);
        }
      } catch (err) {
        console.error(`Error fetching vehicles for ${agencySlug}:`, err);
      }
    }
  }

  return allVehicles;
}
