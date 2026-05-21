"use client";

import { useState, useEffect } from "react";

export default function CameraFeed() {
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    const checkCameraStatus = async () => {
      try {
        const response = await fetch("/api/camera/status");
        const data = await response.json();
        setIsCameraActive(data.is_active);
      } catch {
        setIsCameraActive(false);
      }
    };

    checkCameraStatus();
    const interval = setInterval(checkCameraStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">Live Camera Feed</h3>
      {isCameraActive ? (
        <div className="relative">
          <img
            src="http://localhost:8000/api/camera/stream"
            alt="Live camera feed"
            className="w-full rounded-lg"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">LIVE</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-900/50 rounded-lg border border-gray-700 border-dashed">
          <svg
            className="w-12 h-12 text-gray-600 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 text-sm">Camera offline</p>
          <p className="text-gray-600 text-xs mt-1">
            Start the camera daemon to see live feed
          </p>
        </div>
      )}
    </div>
  );
}
