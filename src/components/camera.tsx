"use client";
import { useEffect, useRef, useState } from "react";
import { IoCameraOutline } from "react-icons/io5";
import { ScaleLoader, SyncLoader } from "react-spinners";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const holdDuration = 500; // Duration in milliseconds to consider it a "hold"

  // Initialize speech recognition
  const initializeRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition is not supported in this browser.");
      return;
    }
    let recordedText = "";

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID"; // Set language
    recognition.interimResults = false; // Only final results
    recognition.continuous = true; // Stop after one sentence

    recognition.onstart = () => {
      recordedText = "";
    }
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        recordedText += transcript + "\n";
      }
    };
    
    recognition.onend = () => {
      console.log(recordedText);
      uploadImage(recordedText);
      handleHoldEnd();
    };

    recognitionRef.current = recognition;
  };

  // Start recording (for hold)
  const startRecording = () => {
    if (!recognitionRef.current) {
      initializeRecognition();
    }
    recognitionRef.current?.start();
    setIsRecording(true);
  };

  // Stop recording (for hold)
  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // Handle mouse down/touch start (start hold timer)
  const handleHoldStart = () => {
    holdTimerRef.current = window.setTimeout(() => {
      startRecording(); // Trigger hold function
    }, holdDuration);
  };

  // Handle mouse up/touch end (clear hold timer)
  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isRecording) {
      stopRecording(); // Stop recording if it was a hold
    }
  };

  const speak = (text: string) => {
    if (!text) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "id-ID"; // Change to your preferred language
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

  const uploadImage = async (recordedText: string = "") => {
    const imageSrc = captureImage();

    if (!imageSrc) return;
    setIsUploading(true);

    try {
      const response = await fetch("/api/process/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageSrc,
          prompt: recordedText ?? "Jelaskan gambar secara singkat.",
        }), // Send Base64 image
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (data.text) {
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
          className="h-[100vh] w-[100vw] object-cover border bg-gray-100"
        />
        <canvas ref={canvasRef} className="hidden "/>

        <div
          className={`absolute bottom-[5%] w-[50%]${
            isRecording ? "scale-90" : ""
          } transition-all`}
        >
          <button
            onClick={() => uploadImage()}
            disabled={isUploading}
            onMouseDown={handleHoldStart} // Start hold timer on mouse down
            onMouseUp={handleHoldEnd} // Clear hold timer on mouse up
            onTouchStart={handleHoldStart} // Start hold timer on touch start
            onTouchEnd={handleHoldEnd} // Clear hold timer on touch end
            className="bg-red-500/80 text-4xl font-bold text-white px-8 py-6 h-20 w-full rounded-xl flex items-center justify-center"
          >
            {isRecording
              ? <ScaleLoader color="white" />
              : isUploading
              ? <SyncLoader color="white"/>
              : <IoCameraOutline size={50}/>}
          </button>
        </div>
      </div>
    </div>
  );
}
