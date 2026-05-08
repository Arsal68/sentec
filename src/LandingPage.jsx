import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";

// images here
const lps = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/lps.png"
const sen = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/sen.png"
const nsa = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nsa.png"
const nas = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nas.png"
const mosaic = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/mosaic.png"
const nds = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/nds.png"
const gsc = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/gsc.png"
const logo = "https://ykitnocbijsdxxydnjwh.supabase.co/storage/v1/object/public/media/logos/logo.png";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const IMAGES = [lps, sen, nsa, nas, mosaic, nds, gsc];

function LandingPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [loaderFinished, setLoaderFinished] = useState(false);
  const containerRef = useRef();

  // 1. Handle image looping independently
  useEffect(() => {
    if (loaderFinished) return;

    const totalFrames = IMAGES.length * 3;
    if (index < totalFrames - 1) {
      const timer = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setLoaderFinished(true); // Signal GSAP to start entrance animations
    }
  }, [index, loaderFinished]);

  // 2. Wrap ALL GSAP code inside useGSAP for automatic cleanup
  useGSAP(() => {
    // Scroll Animation
    gsap.to("#page2 p", {
      xPercent: 120,
      ease: "none",
      scrollTrigger: {
        trigger: "#page2",
        // Removed scroller: "body" - default window handling works much better with React Router
        start: "top 0%",
        end: "+=2000",
        scrub: 1,
        pin: true,
      },
    });

    // Intro Animation (runs only after image cycle finishes)
    if (loaderFinished) {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set("#page", { display: "none" }); // Completely hide overlay
          ScrollTrigger.refresh();
        },
      });

      // INSTANTLY prevent the overlay from blocking button clicks
      tl.set("#page", { pointerEvents: "none" });

      tl.fromTo(
        "#heroSec",
        { y: "100%" },
        { y: "0%", duration: 1.2, ease: "power4.out" }
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
        "-=0.3"
      );
    }
  }, { dependencies: [loaderFinished], scope: containerRef });

  const handleNavigate = () => {
    // Ensure we scroll back to top, otherwise ScrollTrigger leaves the new view pinned/scrolled down
    window.scrollTo(0, 0); 
    navigate("/login");
  };

  return (
    <div ref={containerRef} className="w-full overflow-x-hidden">
      {/* Kept in DOM but managed by GSAP to avoid state-unmount race conditions */}
      <div
        id="page"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#F3C77C]"
      >
        <img
          src={IMAGES[index % IMAGES.length]}
          alt="societies"
          className="w-60 h-60 object-contain"
        />
      </div>

      <div className="min-h-screen bg-[#F9FAFB]">
        <div id="heroSec" className="relative z-10 bg-[#F9FAFB]">
          <nav className="bg-[#FFFFFF] text-[#101828] flex justify-between items-center px-10 py-3 h-18">
            <div id="head" className="w-48">
              <img src={logo} alt="NEDConnect Logo" className="w-full h-full object-contain" />
            </div>
            <div id="links" className="flex gap-8 text cursor-pointer">
              <button
                onClick={handleNavigate}
                className="hover:bg-blue-500 hover:text-white text-[#101828] p-2 rounded-2xl bg-transparent border-2 border-blue-500 font-bold transition-colors z-50"
              >
                SignIn/SignUp
              </button>
            </div>
          </nav>

          <div className="text-[3vw] font-mclaren text-[#101828] h-[calc(100vh-72px)] flex flex-col font-extrabold justify-center items-center">
            <p className="">Connect. Create.</p>
            <p className="">Celebrate.</p>
          </div>
        </div>

        <div
          id="page2"
          className="bg-[#111F35] h-screen flex justify-center items-center overflow-hidden"
        >
          <p className="font-asset text-[35vw] text-white whitespace-nowrap mr-0 leading-none">
            جڑوگے تو جانو گے
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;