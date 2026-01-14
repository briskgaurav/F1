"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function Chapter1Layout() {
  const sectionRef = useRef(null);
  const firstRef = useRef(null);
  const secondRef = useRef(null);
  const thirdRef = useRef(null);
  const finalRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create SplitText instances - using words for smoother animation
      const firstSplit = new SplitText(firstRef.current, { type: "words,lines", mask: "lines" });
      const secondSplit = new SplitText(secondRef.current, { type: "words,lines", mask: "lines" });
      const thirdSplit = new SplitText(thirdRef.current, { type: "words,lines", mask: "lines" });
      const finalSplit = new SplitText(finalRef.current, { type: "words,lines", mask: "lines" });

      // Initial states - clean and smooth
      gsap.set(firstSplit.words, { 
        opacity: 1, 
        filter: "blur(0px)",
        y: 0
      });
      gsap.set(secondSplit.words, { 
        opacity: 0, 
        filter: "blur(4px)",
        y: 50
      });
      gsap.set(thirdSplit.words, { 
        opacity: 0, 
        filter: "blur(4px)",
        y: 50
      });
      gsap.set(finalSplit.words, { 
        opacity: 0, 
        filter: "blur(6px)",
        y: 50
      });

      // Timeline with ScrollTrigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#chapter1",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });

      // First text fades out smoothly
      tl.to(firstSplit.words, { 
        opacity: 0, 
        filter: "blur(6px)",
        y: -50,
        stagger: 0.05, 
        duration: 0.5,
        ease: "power2.inOut"
      }, "+=0.6")

        // Second text reveals smoothly
        .to(secondSplit.words, { 
          opacity: 1, 
          filter: "blur(0px)",
          y: 0,
          stagger: 0.08, 
          duration: 0.6,
          ease: "power2.out"
        }, "+=0.15")
        
        // Third text reveals with slight delay
        .to(thirdSplit.words, { 
          opacity: 1, 
          filter: "blur(0px)",
          y: 0,
          stagger: 0.08, 
          duration: 0.6,
          ease: "power2.out"
        }, "-=0.3")
        
        // Both fade out together
        .to([secondSplit.words, thirdSplit.words], { 
          opacity: 0, 
          filter: "blur(4px)",
          y: -50,
          stagger: 0.03, 
          duration: 0.4,
          ease: "power2.in"
        }, "+=0.7")

        // Final text emerges
        .to(finalSplit.words, { 
          opacity: 1, 
          filter: "blur(0px)",
          y: 0,
          stagger: 0.1, 
          duration: 0.7,
          ease: "power2.out"
        }, "+=0.3");

      // Cleanup function to revert SplitText
      return () => {
        firstSplit.revert();
        secondSplit.revert();
        thirdSplit.revert();
        finalSplit.revert();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="h-screen z-999 tracking-tighter sticky top-0 w-full overflow-hidden">
      {/* First text */}
      <h1
        ref={firstRef}
        className="bigtext tracking-tighter text-left absolute top-[30%] left-[22%] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none normal-case will-change-transform"
      >
        The Physics <br /> Behind Speed
      </h1>

      {/* Second and Third text side by side (top and bottom) */}
      <div className="w-full h-screen absolute inset-0 p-[3vw] flex flex-col justify-between pointer-events-none select-none">
        <h2
          ref={secondRef}
          className="bigtext w-fit tracking-tighter normal-case will-change-transform"
        >
          Speed Is <br />
          Invisible
        </h2>
        <h2
          ref={thirdRef}
          className="bigtext tracking-tighter w-fit ml-auto text-right normal-case will-change-transform"
        >
          Until Physics <br /> Reveals It
        </h2>
      </div>

      {/* Final text */}
      <h2
        ref={finalRef}
        className="bigtext w-fit text-center tracking-tighter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none normal-case will-change-transform"
      >
        We Can Feel <br /> It Through
      </h2>
    </section>
  );
}
