import React, { useState } from "react";

const App = () => {
  const [location, setLocation] = useState("");

  const getUserLocation = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve("Geolocation Not Supported");
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();

            const addr = data.address || {};
            const locationName =
              addr.suburb ||
              addr.neighbourhood ||
              addr.locality ||
              addr.quarter ||
              addr.hamlet ||
              addr.village ||
              addr.town ||
              addr.city ||
              "Unknown";

            const country = addr.country || "Unknown";

            resolve(`${locationName}, ${country}`);
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
            resolve("Unknown Location");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          resolve("Permission Denied");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleFindLocation = async () => {
    const loc = await getUserLocation();
    setLocation(loc);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 max-w-md sm:max-w-lg w-full text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-indigo-700">
          Find My Location
        </h1>
        <button
          onClick={handleFindLocation}
          className="px-5 py-2 sm:px-6 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md transition duration-200 w-full sm:w-auto"
        >
          Find Location
        </button>
        {location && (
          <p className="mt-6 text-base sm:text-lg text-gray-700 bg-gray-100 p-4 rounded-md border border-gray-300">
            📍 {location}
          </p>
        )}
      </div>
    </div>
  );
};

export default App;
