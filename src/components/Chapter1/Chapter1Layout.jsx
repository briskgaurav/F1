"use client"
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Chapter1Layout() {
  const containerRef = useRef(null)
  const lettersRef = useRef([])

  useEffect(() => {
    const letters = lettersRef.current

    gsap.to(letters, {
      xPercent: 100,
      ease: "none",
      scrollTrigger: {
        trigger: letters,
        start: "top 20%",
        end: "bottom bottom",
        scrub: 1,
      }
    })

    gsap.to(letters, {
      clipPath: "inset(0 100% 0 0)",
      ease: "none",
      scrollTrigger: {
        trigger: letters,
        start: "top 20%",
        end: "bottom bottom",
        scrub: 1,
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <section className='h-screen w-full py-[5vh] flex px-[5vw] flex-col items-end justify-end absolute top-0 left-0'>
      <div ref={containerRef} className='fixed bigtext top-[45%] left-0 w-full h-fit -translate-y-1/2 flex justify-evenly'>
        {['L', 'I', 'M', 'I', 'T', 'L', 'E', 'S', 'S'].map((letter, index) => (
          <span
            key={index}
            ref={el => lettersRef.current[index] = el}
            style={{ clipPath: "inset(0 0% 0 0)" }}
          >
            {letter}
          </span>
        ))}
      </div>

      <div className=' font-IBM-mono uppercase text-[1.1vw] w-[25vw] text-justify text-[#E8F2F8]'>
        Speed is not just movement, it's an experience shaped by physics.Every force, every motion, and every reaction pushes the boundaries of what's possible.
      </div>

    </section>
  )
}
