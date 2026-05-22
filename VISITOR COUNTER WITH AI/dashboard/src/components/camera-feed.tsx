"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Video, Radio, AlertCircle } from "lucide-react";

const STATUS_POLL_INTERVAL_MS = 3000;
const FRAME_POLL_INTERVAL_MS = 100;

export default function CameraFeed() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frameObjectUrlRef = useRef<string | null>(null);

  // Poll camera status
  useEffect(() => {
    const checkCameraStatus = async () => {
      try {
        const response = await fetch("/api/camera/status");
        if (!response.ok) {
          setIsCameraActive(false);
          setError("API server returned an error");
          return;
        }
        const data = await response.json();
        setIsCameraActive(data.is_active === true);
        if (data.is_active) {
          setError(null);
        } else {
          setError("Camera daemon is not running or RealSense is not connected");
        }
      } catch {
        setIsCameraActive(false);
        setError("Cannot reach API server — is it running on port 8000?");
      }
    };

    checkCameraStatus();
    const interval = setInterval(checkCameraStatus, STATUS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Poll frames when camera is active
  const fetchFrame = useCallback(async () => {
    try {
      const response = await fetch("/api/camera/frame");
      if (!response.ok) {
        if (response.status === 503) {
          setIsCameraActive(false);
          setError("Camera went offline");
        }
        return;
      }
      const blob = await response.blob();

      // Revoke previous object URL to avoid memory leaks
      if (frameObjectUrlRef.current) {
        URL.revokeObjectURL(frameObjectUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      frameObjectUrlRef.current = url;
      setFrameUrl(url);
    } catch {
      // Network error — keep previous frame, status poll will catch offline state
    }
  }, []);

  useEffect(() => {
    if (!isCameraActive) {
      setFrameUrl(null);
      if (frameObjectUrlRef.current) {
        URL.revokeObjectURL(frameObjectUrlRef.current);
        frameObjectUrlRef.current = null;
      }
      return;
    }

    // Fetch immediately when camera becomes active
    fetchFrame();
    const interval = setInterval(fetchFrame, FRAME_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isCameraActive, fetchFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameObjectUrlRef.current) {
        URL.revokeObjectURL(frameObjectUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-surface rounded-xl p-4 shadow-sm border border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <Video className="w-4 h-4 text-text-secondary" />
        <h2 className="text-base font-semibold text-text-primary">
          Live Camera Feed
        </h2>
        {isCameraActive && (
          <span className="ml-auto inline-flex items-center gap-1.5 bg-accent-red/10 rounded-full px-2.5 py-1 border border-accent-red/20">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
            <span className="text-[11px] text-accent-red font-medium">LIVE</span>
          </span>
        )}
      </div>

      {isCameraActive && frameUrl ? (
        <div className="relative">
          <img
            src={frameUrl}
            alt="Live camera feed"
            className="w-full rounded-lg border border-border-subtle"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-elevated/30 rounded-lg border border-border-subtle border-dashed">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
            <Video className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">Camera offline</p>
          {error ? (
            <div className="flex items-center gap-1.5 mt-2 text-text-muted/80 text-xs max-w-xs text-center px-4">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {error}
            </div>
          ) : (
            <p className="text-text-muted/70 text-xs mt-1">
              Start the camera daemon to see live feed
            </p>
          )}
        </div>
      )}
    </div>
  );
}
