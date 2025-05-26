import React, { useState, useRef } from "react";

const App = () => {
  const [location, setLocation] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Your existing location code (unchanged)
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

            resolve(
              `${locationName}, ${country} (Lat: ${latitude.toFixed(
                4
              )}, Lon: ${longitude.toFixed(4)})`
            );
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
            resolve(
              `Unknown Location (Lat: ${latitude.toFixed(
                4
              )}, Lon: ${longitude.toFixed(4)})`
            );
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

  // Start camera for face scan
  const startScan = async () => {
    setCapturedImage(null);
    setIsScanning(true);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        alert("Cannot access webcam");
        setIsScanning(false);
      }
    } else {
      alert("Webcam not supported in this browser.");
      setIsScanning(false);
    }
  };

  // Capture face image from video
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    setCapturedImage(dataUrl);

    // Stop all video streams to turn off camera
    video.srcObject.getTracks().forEach((track) => track.stop());
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-6 text-indigo-700">Find My Location & Face Scan</h1>

        {/* Find Location Button */}
        <button
          onClick={handleFindLocation}
          className="mb-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-md transition duration-200"
        >
          Find Location
        </button>

        {location && (
          <p className="mt-4 text-gray-700 text-lg bg-gray-100 p-4 rounded-md border border-gray-300">
            {location}
          </p>
        )}

        <hr className="my-8" />

        {/* Scan Face Button */}
        {!isScanning && !capturedImage && (
          <button
            onClick={startScan}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-md transition duration-200"
          >
            Scan Face
          </button>
        )}

        {/* Video Preview for Scanning */}
        {isScanning && (
          <div className="mt-6">
            <video
              ref={videoRef}
              className="mx-auto rounded-lg border border-gray-400"
              width="320"
              height="240"
            />
            <div className="mt-4">
              <button
                onClick={captureImage}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-200"
              >
                Capture
              </button>
            </div>
          </div>
        )}

        {/* Display Captured Image */}
        {capturedImage && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 text-indigo-700">Captured Face Image</h2>
            <img
              src={capturedImage}
              alt="Captured face"
              className="mx-auto rounded-lg border border-gray-400 max-w-full h-auto"
            />
            <button
              onClick={() => setCapturedImage(null)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md transition duration-200"
            >
              Retake
            </button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export default App;
