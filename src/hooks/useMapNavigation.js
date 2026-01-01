/**
 * Hook that provides map navigation utilities.
 * @param {React.RefObject} mapRef - Reference to the Mapbox map instance
 */
export function useMapNavigation(mapRef) {
  const zoomIn = (zoom = 14.01) => {
    mapRef.current?.easeTo({ zoom });
  };

  const geolocate = (zoom = 15) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapRef.current?.easeTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom,
        });
      });
    }
  };

  return { zoomIn, geolocate };
}
