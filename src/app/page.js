import Chapter1 from "@/components/Chapter1/Chapter1";
import Chapter1Layout from "@/components/Chapter1/Chapter1Layout";
import EdgeNoise from "@/components/Chapter1/EdgeNoise";
import ScrollBarCustom from "@/components/Lenis/Scrollbar";
import React from "react";

export default function page() {
  return (
    <>
      <ScrollBarCustom />
      <section id="chapter1" className="h-[1000vh] w-screen bg-black">
        <Chapter1 />
        <EdgeNoise />
        {/* <Chapter1Layout /> */}
      </section>
    </>
  );
}
