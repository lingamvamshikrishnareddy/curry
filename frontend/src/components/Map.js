const GoogleMap = ({ latitude, longitude }) => {
  const mapRef = React.useRef(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (latitude && longitude && window.google) {
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 15,
        });
        new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: map,
        });
      } catch (error) {
        console.error('Error initializing Google Map:', error);
        setMapError('Failed to load the map. Please try again later.');
      }
    }
  }, [latitude, longitude]);

  if (mapError) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg">
        {mapError}
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-64 rounded-lg shadow-md" />
  );
};