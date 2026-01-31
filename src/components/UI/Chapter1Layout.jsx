import React from 'react'

export default function Chapter1Layout() {
  return (
    <div className='w-full absolute inset-0'>
      <section className='h-screen w-full px-[4vw] flex flex-col justify-between'>
        <div className='mt-[20vh] relative w-fit'>
          <h1 className=' uppercase bigtext tracking-tighter'>\_Break</h1>
          <p className='text-[1.2vw] font-IBM-mono uppercase leading-none absolute bottom-0 top-[8vw] left-[12vw] tracking-widest text-right'>CONCEPT BY CRAZY DEVS</p>
          <h2 className=' uppercase bigtext tracking-tighter'>Limits</h2>
        </div>

        <div className='w-full h-[20vh] flex items-center justify-between'>
          <p className='text-[1.2vw] font-IBM-mono uppercase leading-tight w-[13%] text-justify'>SCROLL TO FEEL THE SPEED ⌄</p>
          <p className='text-[1.2vw] font-IBM-mono uppercase leading-tight w-[25%] text-justify'>Speed isn't just movement it's an experience shaped by physics. Every force and motion pushes what's possible.</p>
        </div>
      </section>

      <section className='h-screen w-full px-[4vw] flex flex-col justify-between'>
        <div className='w-fit mt-[20vh] ml-auto text-right '>
          <h2 className=' uppercase bigtext tracking-tighter'>crafted</h2>
          <h2 className=' uppercase bigtext tracking-tighter'>for - air</h2>
        </div>
      </section>
    </div>
  )
}
