import React, { useState, useRef, useEffect } from 'react';

// Braille to English mapping
const BRAILLE_TO_ENGLISH = {
    '⠁': 'a', '⠃': 'b', '⠉': 'c', '⠙': 'd', '⠑': 'e',
    '⠋': 'f', '⠛': 'g', '⠓': 'h', '⠊': 'i', '⠚': 'j',
    '⠅': 'k', '⠇': 'l', '⠍': 'm', '⠝': 'n', '⠕': 'o',
    '⠏': 'p', '⠟': 'q', '⠗': 'r', '⠎': 's', '⠞': 't',
    '⠥': 'u', '⠧': 'v', '⠺': 'w', '⠭': 'x', '⠽': 'y',
    '⠵': 'z', '⠀': ' ', '⠂': ',', '⠲': '.', '⠦': '?',
    '⠆': ';', '⠖': '!', '⠢': ':', '⠔': "'", '⠴': '"',
    '⠶': '(', '⠷': ')', '⠿': '#', '⠾': '*', '⠼': '%',
    '⠰': '/', '⠣': '-', '⠻': '='
};

function App() {
    const [convertedText, setConvertedText] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [imageData, setImageData] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Convert Braille text to English
    const convertBrailleToEnglish = (brailleText) => {
        let result = '';
        for (let char of brailleText) {
            result += BRAILLE_TO_ENGLISH[char] || char;
        }
        return result;
    };

    // Start camera for scanning
    const startCamera = async () => {
        try {
            setCameraError(null);
            setIsScanning(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError('Could not access camera. Please ensure you have granted camera permissions.');
            setIsScanning(false);
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    // Capture image from camera
    const captureImage = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL('image/png');
        setImageData(imageDataUrl);
        
        // In a real app, you would send this image to a backend for processing
        // For this demo, we'll simulate processing with a textarea input
    };

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Braille Scanner</h1>
                
                {/* Camera Section */}
                <div className="mb-6">
                    {!isScanning ? (
                        <button
                            onClick={startCamera}
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Start Camera
                        </button>
                    ) : (
                        <>
                            <div className="relative mb-2">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full border rounded"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={captureImage}
                                    className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Capture
                                </button>
                                <button
                                    onClick={stopCamera}
                                    className="flex-1 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Stop Camera
                                </button>
                            </div>
                        </>
                    )}
                    {cameraError && (
                        <p className="mt-2 text-red-500 text-sm">{cameraError}</p>
                    )}
                </div>

                {/* Image Preview */}
                {imageData && (
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-2">Captured Image</h2>
                        <img 
                            src={imageData} 
                            alt="Captured Braille" 
                            className="w-full border rounded"
                        />
                        <p className="mt-2 text-sm text-gray-600">
                            Note: This demo shows the camera functionality. In a real app, this image would be sent to a backend service for Braille recognition.
                        </p>
                    </div>
                )}

                {/* Manual Input Fallback */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2">Or Enter Braille Manually</h2>
                    <textarea
                        placeholder="Paste Braille characters here..."
                        className="w-full p-2 border rounded"
                        rows="4"
                        onChange={(e) => setConvertedText(convertBrailleToEnglish(e.target.value))}
                    />
                </div>

                {/* Converted Text */}
                <div>
                    <h2 className="text-lg font-semibold mb-2">Converted Text</h2>
                    <div className="p-4 bg-gray-50 rounded border">
                        {convertedText || 'Converted text will appear here...'}
                    </div>
                </div>

                {/* Braille Reference */}
                <div className="mt-6">
                    <h3 className="font-semibold mb-2">Braille Reference</h3>
                    <div className="grid grid-cols-6 gap-2 text-sm">
                        {Object.entries(BRAILLE_TO_ENGLISH).slice(0, 26).map(([braille, eng]) => (
                            <div key={eng} className="bg-gray-100 p-2 rounded text-center">
                                {braille}: {eng}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;