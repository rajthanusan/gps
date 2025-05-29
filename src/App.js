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

// Mock function to simulate Braille detection from an image
// In a real app, this would be done by a backend service or ML model
const detectBrailleFromImage = (imageData) => {
    // This is just a mock - returns random Braille characters for demonstration
    // In reality, you would send the image to a backend for processing
    console.log("Image data received for processing:", imageData.substring(0, 30) + "...");
    
    // Simulate processing delay
    return new Promise(resolve => {
        setTimeout(() => {
            // Return some sample Braille text
            const sampleBraille = "⠓⠑⠇⠇⠕ ⠺⠕⠗⠇⠙";
            resolve(sampleBraille);
        }, 1500);
    });
};

function App() {
    const [brailleText, setBrailleText] = useState('');
    const [convertedText, setConvertedText] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [imageData, setImageData] = useState(null);
    const [scanInstructions, setScanInstructions] = useState('Position Braille text in the camera view');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectionTimeoutRef = useRef(null);

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
            setScanInstructions('Position Braille text in the camera view');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            
            // Start periodic checking for Braille (simulated)
            startBrailleDetection();
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError('Could not access camera. Please ensure you have granted camera permissions.');
            setIsScanning(false);
        }
    };

    // Simulate Braille detection by periodically checking
    const startBrailleDetection = () => {
        detectionTimeoutRef.current = setInterval(() => {
            if (isScanning && videoRef.current && videoRef.current.readyState === 4) {
                attemptBrailleDetection();
            }
        }, 2000); // Check every 2 seconds
    };

    // Attempt to detect Braille (simulated)
    const attemptBrailleDetection = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // For demo purposes, we'll just capture the image
        // In a real app, you would analyze the image for Braille dots
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Simulate processing
        setIsProcessing(true);
        setScanInstructions('Detecting Braille...');
        
        detectBrailleFromImage(imageDataUrl).then(detectedBraille => {
            setBrailleText(detectedBraille);
            setConvertedText(convertBrailleToEnglish(detectedBraille));
            setImageData(imageDataUrl);
            setIsProcessing(false);
            setScanInstructions('Braille detected!');
            
            // Stop scanning after successful detection
            setTimeout(() => {
                stopCamera();
                setScanInstructions('Scan complete');
            }, 1000);
        });
    };

    // Stop camera
    const stopCamera = () => {
        if (detectionTimeoutRef.current) {
            clearInterval(detectionTimeoutRef.current);
            detectionTimeoutRef.current = null;
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    // Manual Braille input
    const handleManualInput = (e) => {
        const input = e.target.value;
        setBrailleText(input);
        setConvertedText(convertBrailleToEnglish(input));
    };

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (detectionTimeoutRef.current) {
                clearInterval(detectionTimeoutRef.current);
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
                            Scan Braille Text
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
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center p-2">
                                    {scanInstructions}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={stopCamera}
                                    className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Cancel Scan'}
                                </button>
                            </div>
                        </>
                    )}
                    {cameraError && (
                        <p className="mt-2 text-red-500 text-sm">{cameraError}</p>
                    )}
                </div>

                {/* Results Section */}
                {convertedText && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2">Scan Results</h2>
                        
                        {imageData && (
                            <div className="mb-4">
                                <h3 className="font-medium mb-1">Captured Image</h3>
                                <img 
                                    src={imageData} 
                                    alt="Captured Braille" 
                                    className="w-full border rounded"
                                />
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <h3 className="font-medium mb-1">Detected Braille</h3>
                            <div className="p-3 bg-gray-100 rounded border text-xl">
                                {brailleText}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-medium mb-1">Converted Text</h3>
                            <div className="p-3 bg-gray-100 rounded border font-mono">
                                {convertedText}
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Input Fallback */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Manual Braille Input</h2>
                    <textarea
                        placeholder="Enter Braille characters here..."
                        className="w-full p-2 border rounded"
                        rows="3"
                        value={brailleText}
                        onChange={handleManualInput}
                    />
                    <p className="mt-1 text-sm text-gray-600">
                        Tip: Use the Braille reference below to enter characters
                    </p>
                </div>

                {/* Braille Reference */}
                <div>
                    <h3 className="font-semibold mb-2">Braille Reference</h3>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                        {Object.entries(BRAILLE_TO_ENGLISH).slice(0, 26).map(([braille, eng]) => (
                            <div key={eng} className="bg-gray-100 p-2 rounded text-center">
                                <span className="text-lg">{braille}</span>: {eng.toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-sm mt-2">
                        {Object.entries(BRAILLE_TO_ENGLISH).slice(26).map(([braille, eng]) => (
                            <div key={eng} className="bg-gray-100 p-2 rounded text-center">
                                <span className="text-lg">{braille}</span>: {eng}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;