import { useEffect, useRef } from "react";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4";

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf: number;
    const fade = () => {
      if (!video.duration) { raf = requestAnimationFrame(fade); return; }
      const t = video.currentTime;
      const d = video.duration;
      if (t < 0.8) video.style.opacity = String(Math.min(t / 0.8, 0.46));
      else if (t > d - 0.8) video.style.opacity = String(Math.max(((d - t) / 0.8) * 0.46, 0));
      else video.style.opacity = "0.46";
      raf = requestAnimationFrame(fade);
    };
    raf = requestAnimationFrame(fade);
    const onEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => { video.currentTime = 0; video.play(); }, 150);
    };
    video.addEventListener("ended", onEnded);
    return () => { cancelAnimationFrame(raf); video.removeEventListener("ended", onEnded); };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay muted playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
        style={{ opacity: 0 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="fixed inset-0 z-0 bg-background/42 pointer-events-none" />
    </>
  );
}
