"use client";
import { useEffect, useRef, useState } from "react";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [text, setText] = useState("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  });

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const base64Image = canvasRef.current.toDataURL("image/png");
        return base64Image;
      }
    }
    return null;
  };

  const uploadImage = async () => {
    const imageSrc = captureImage();

    if (!imageSrc) return;
    setIsUploading(true);

    try {
      const response = await fetch("/api/process/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }), // Send Base64 image
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (data.text) {
        setText(data.text);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-[80%]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-100 aspect-video border bg-gray-100"
      />
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />

      <div className="flex space-x-4 mt-2 mb-8">
        <button
          onClick={uploadImage}
          disabled={isUploading}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
      {text && <p className="text-xl w-[80%] text-center">{text}</p>}
    </div>
  );
}
