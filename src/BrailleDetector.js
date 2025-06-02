import React, { useRef, useState } from "react";

function BrailleDetectorNoOpenCV() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [brailleOutput, setBrailleOutput] = useState("");
  const [decodedText, setDecodedText] = useState("");
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const dotsCanvasRef = useRef(null);

  const brailleToTextMap = {
    "⠁": "a", "⠃": "b", "⠉": "c", "⠙": "d", "⠑": "e",
    "⠋": "f", "⠛": "g", "⠓": "h", "⠊": "i", "⠚": "j",
    "⠅": "k", "⠇": "l", "⠍": "m", "⠝": "n", "⠕": "o",
    "⠏": "p", "⠟": "q", "⠗": "r", "⠎": "s", "⠞": "t",
    "⠥": "u", "⠧": "v", "⠺": "w", "⠭": "x", "⠽": "y", "⠵": "z",
    "⠀": " ", // blank
  };

  const decodeBrailleToText = (braille) => {
    return braille
      .split("\n")
      .map(line =>
        line
          .split("")
          .map(char => brailleToTextMap[char] || "?")
          .join("")
      )
      .join("\n");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image")) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        previewRef.current.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = () => {
    if (!image) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const dotsCanvas = dotsCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const dotsCtx = dotsCanvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      dotsCanvas.width = img.width;
      dotsCanvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      dotsCtx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const threshold = 160;
      const binary = new Uint8Array(canvas.width * canvas.height);

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          binary[y * canvas.width + x] = gray < threshold ? 1 : 0;
          const color = gray < threshold ? 0 : 255;
          data[i] = data[i + 1] = data[i + 2] = color;
        }
      }

      dotsCtx.putImageData(imageData, 0, 0);

      const visited = new Uint8Array(canvas.width * canvas.height);
      const dotCenters = [];
      const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [1, -1], [-1, 1], [1, 1],
      ];

      function bfs(sx, sy) {
        const queue = [[sx, sy]];
        let minX = sx, maxX = sx, minY = sy, maxY = sy;
        visited[sy * canvas.width + sx] = 1;

        while (queue.length > 0) {
          const [x, y] = queue.shift();
          for (const [dx, dy] of directions) {
            const nx = x + dx, ny = y + dy;
            const idx = ny * canvas.width + nx;
            if (
              nx >= 0 && ny >= 0 && nx < canvas.width &&
              ny < canvas.height && !visited[idx] &&
              binary[idx] === 1
            ) {
              visited[idx] = 1;
              queue.push([nx, ny]);
              minX = Math.min(minX, nx);
              maxX = Math.max(maxX, nx);
              minY = Math.min(minY, ny);
              maxY = Math.max(maxY, ny);
            }
          }
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const area = width * height;

        if (area > 30 && area < 1000 && width < 50 && height < 50) {
          dotsCtx.strokeStyle = "red";
          dotsCtx.lineWidth = 2;
          dotsCtx.strokeRect(minX, minY, width, height);
          dotCenters.push({
            x: Math.floor((minX + maxX) / 2),
            y: Math.floor((minY + maxY) / 2),
          });
        }
      }

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = y * canvas.width + x;
          if (binary[idx] === 1 && !visited[idx]) {
            bfs(x, y);
          }
        }
      }

      setResult(`Detected ${dotCenters.length} possible Braille dots.`);

      const cellSize = 60;
      const grid = {};

      for (const dot of dotCenters) {
        const col = Math.floor(dot.x / cellSize);
        const row = Math.floor(dot.y / cellSize);
        const key = `${row},${col}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(dot);
      }

      let maxCol = 0;
      let maxRow = 0;
      for (const key of Object.keys(grid)) {
        const [row, col] = key.split(',').map(Number);
        maxCol = Math.max(maxCol, col);
        maxRow = Math.max(maxRow, row);
      }

      const gridMatrix = Array.from({ length: maxRow + 1 }, () =>
        Array(maxCol + 1).fill("⠀")
      );

      for (const key in grid) {
        const [row, col] = key.split(',').map(Number);
        const dots = grid[key];
        const baseX = col * cellSize;
        const baseY = row * cellSize;

        const bits = [0, 0, 0, 0, 0, 0];

        for (const dot of dots) {
          const offsetX = dot.x - baseX;
          const offsetY = dot.y - baseY;

          if (offsetX < cellSize / 2) {
            if (offsetY < cellSize / 3) bits[0] = 1;
            else if (offsetY < (2 * cellSize) / 3) bits[1] = 1;
            else bits[2] = 1;
          } else {
            if (offsetY < cellSize / 3) bits[3] = 1;
            else if (offsetY < (2 * cellSize) / 3) bits[4] = 1;
            else bits[5] = 1;
          }
        }

        const unicodeOffset =
          0x2800 +
          (bits[0] << 0) +
          (bits[1] << 1) +
          (bits[2] << 2) +
          (bits[3] << 3) +
          (bits[4] << 4) +
          (bits[5] << 5);

        const brailleChar = String.fromCharCode(unicodeOffset);
        gridMatrix[row][col] = brailleChar;
      }

      const brailleLines = gridMatrix.map((row) => row.join("")).join("\n");
      setBrailleOutput(brailleLines);

      const english = decodeBrailleToText(brailleLines);
      setDecodedText(english);
    };

    img.src = URL.createObjectURL(image);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
        Braille Dot Detector
      </h1>

      <label
        htmlFor="file-upload"
        className="cursor-pointer inline-block px-6 py-3 mb-6 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-300"
      >
        Upload Image
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {image && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <p className="font-semibold mb-2">Original Image</p>
              <img
                ref={previewRef}
                alt="Preview"
                className="max-h-64 object-contain border rounded shadow-md mx-auto"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold mb-2">Detected Dots</p>
              <canvas
                ref={dotsCanvasRef}
                className="w-full border rounded shadow-inner"
                style={{ imageRendering: "pixelated" }}
              />
              <button
                onClick={() => {
                  const canvas = dotsCanvasRef.current;
                  const link = document.createElement("a");
                  link.download = "detected_dots.png";
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                }}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Download Detected Dots Image
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          <button
            onClick={processImage}
            className="block mx-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-300"
          >
            Detect Braille Dots
          </button>
        </>
      )}

      {result && (
        <p className="mt-6 text-center text-lg font-semibold text-gray-700">
          {result}
        </p>
      )}

      {brailleOutput && (
        <div className="mt-4 p-4 bg-gray-100 rounded text-center whitespace-pre-wrap text-2xl font-mono">
          {brailleOutput}
        </div>
      )}

      {decodedText && (
        <div className="mt-4 p-4 bg-yellow-100 rounded text-center text-xl font-semibold text-gray-800">
          Decoded Text: <br />
          <span className="font-mono">{decodedText}</span>
        </div>
      )}
    </div>
  );
}

export default BrailleDetectorNoOpenCV;
