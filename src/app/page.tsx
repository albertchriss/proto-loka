import CameraCapture from "@/components/camera";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-3 justify-center min-h-screen">
      <CameraCapture />
    </div>
  );
}
