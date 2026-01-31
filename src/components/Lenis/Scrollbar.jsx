"use client"
import React, { useEffect, useState, useRef } from 'react'

export default function ScrollBarCustom() {
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const animationRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const percentage = (currentScroll / scrollHeight) * 100;
            setScrollPercentage(Math.min(percentage, 100));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Smooth animation for display percentage
    useEffect(() => {
        const animate = () => {
            setDisplayPercentage(prev => {
                const diff = scrollPercentage - prev;
                if (Math.abs(diff) < 0.1) return scrollPercentage;
                return prev + diff * 0.12;
            });
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [scrollPercentage]);

    return (
        <>
            <div className='h-[4px] fixed z-999 top-0 left-0 w-full bg-zinc-950/80'>
                <div
                    className="h-full transition-none"
                    style={{
                        width: `${displayPercentage}%`,
                        background: 'linear-gradient(90deg, rgba(255,50,25,0.4) 0%, rgba(255,60,30,0.7) 50%, rgba(255,80,45,1) 100%)',
                    }}
                />
            </div>


        </>
    )
}