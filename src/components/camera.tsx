"use client";
import { useEffect, useRef, useState } from "react";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [text, setText] = useState("");

  const speak = (text: string) => {
    if (!text) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US"; // Change to your preferred language
    speech.rate = 1; // Speed of speech (0.5 - 2)
    speech.pitch = 1; // Pitch (0 - 2)
    speechSynthesis.speak(speech);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
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
        speak(data.text);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full relative">
      <div className="relative w-full h-full flex justify-center items-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-fit border bg-gray-100"
        />
        <canvas ref={canvasRef} width={640} height={480} className="hidden" />

        <div className="absolute bottom-[5%]">
          <button
            onClick={uploadImage}
            disabled={isUploading}
            className="bg-red-500/80 text-4xl font-bold text-white px-8 py-6 rounded-xl"
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </button>
        </div>
      </div>
      <div className="mt-4 w-full flex justify-center">{text && <p className="text-xl w-[80%] text-center">{text}</p>}</div>
    </div>
  );
}
