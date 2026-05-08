import { useState, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";

// images here
const lps =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/lps.png";
const sen =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/sen.png";
const nsa =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nsa.png";
const nas =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nas.png";
const mosaic =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/mosaic.png";
const nds =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nds.png";
const gsc =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/gsc.png";
const logo =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/logo.png";
const heroVid =
  "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/vid/vid02.mp4";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const IMAGES = [lps, sen, nsa, nas, mosaic, nds, gsc];

function LandingPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useGSAP(() => {
    
gsap.set("#page2 p", { xPercent: -80 });

const tl = gsap.timeline();

tl.to("#page2 p", {
  xPercent: 120, 
  ease: "none",
  scrollTrigger: {
    trigger: "#page2",
    start: "top 0%",
    end: "+=2000",
    scrub: 1,
    pin: true,
  },
});
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const totalFrames = IMAGES.length * 3;

    if (index < totalFrames - 1) {
      const timer = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
          ScrollTrigger.refresh();
        },
      });

      tl.fromTo(
        "#heroSec",
        { y: "100%" },
        { y: "0%", duration: 1.2, ease: "power4.out" },
      );

      tl.to("#page", { opacity: 0, duration: 0.5 }, "-=0.5");

      tl.from("#head", { y: -20, opacity: 0, duration: 0.5 });
      tl.from(
        "#links button",
        {
          y: -20,
          opacity: 0,
          stagger: 0.1,
          duration: 0.4,
        },
        "-=0.3",
      );
    }
  }, [index, isVisible]);

  return (
    <div className="w-full overflow-x-hidden">
      {isVisible && (
        <div
          id="page"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#f1cd00]"
        >
          <img
            src={IMAGES[index % IMAGES.length]}
            alt="societies"
            className="w-60 h-60 object-contain"
          />
        </div>
      )}

      <div className="min-h-screen bg-[#F9FAFB]">
        <div id="heroSec" className="relative z-10 bg-[#F9FAFB]">
          <div className="relative h-[100vh] overflow-hidden">
            <video
              src={heroVid}
              autoPlay
              muted
              loop
              className="absolute inset-0 w-full h-full object-cover"
            />

            <nav className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-10   text-white">
              <div id="head" className="w-48">
                <img
                  src={logo}
                  alt="NEDConnect Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div id="links" className="flex gap-8">
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-2xl border-2 border-white bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white hover:text-slate-900"
                >
                  SignIn/SignUp
                </button>
              </div>
            </nav>

            <div className="relative z-10 flex flex-col items-center justify-center h-full text-[3vw] font-extrabold text-white">
              <p>Connect. Create.</p>
              <p>Celebrate.</p>
            </div>
          </div>
        </div>

        <div
          id="page2"
          className="bg-[#2a0845] h-screen flex justify-center items-center overflow-hidden"
        >
          <p
            dir="rtl"
            className="font-asset text-[35vw] text-[#ffd700] whitespace-nowrap leading-none"
          >
            جڑوگے تو جانو گے
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;