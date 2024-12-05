// 'use client';

// import React from 'react'
// import Button from './components/Button'
// import { useRouter } from 'next/navigation'

// const Home = () => {
//   const router = useRouter();
//   return (
//     <div className='h-screen flex flex-col justify-center items-center gap-5 space-y-4'>
//       <Button text='オセロ' onClick={() => {
//         router.push('/create/othello')
//       }}/>
//       <Button text='神経衰弱' onClick={() => {
//         router.push('/create/shinkei')
//       }}/>
//       <Button text='Hit&Blow' onClick={() => {
//         router.push('create/hitandblow')
//       }} />
//     </div>
//   )
// }

// export default Home

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './components/Button2'

const Home = () => {
  const router = useRouter()

  return (
    <div className='min-h-screen flex flex-col justify-center items-center'>
      <div className='grid grid-cols-3 gap-6 w-full max-w-4xl px-4'>
        <Button 
          onClick={() => router.push('/create/othello')}
          className="h-80 text-2xl font-bold bg-primary/90 hover:bg-primary/100 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          variant="default"
        >
          オセロ
        </Button>
        <Button 
          onClick={() => router.push('/create/shinkei')}
          className="h-80 text-2xl font-bold bg-primary/90 hover:bg-primary/100 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          variant="default"
        >
          神経衰弱
        </Button>
        <Button 
          onClick={() => router.push('/create/hitandblow')}
          className="h-80 text-2xl font-bold bg-primary/90 hover:bg-primary/100 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          variant="default"
        >
          ヒット＆ブロー
        </Button>
      </div>
    </div>
  )
}

export default Home


