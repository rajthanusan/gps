import React, { useState, useRef } from "react";

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

    // Stop video stream
    video.srcObject.getTracks().forEach((track) => track.stop());
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-6 text-indigo-700">Face Scanner</h1>

        {/* Scan Face Button */}
        {!isScanning && !capturedImage && (
          <button
            onClick={startScan}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-md transition duration-200"
          >
            Scan Face
          </button>
        )}

        {/* Video Preview */}
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

        {/* Captured Image Display */}
        {capturedImage && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 text-indigo-700">Scanned Face</h2>
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
