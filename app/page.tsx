'use client';

import React from 'react'
import Button from './components/Button'
import { useRouter } from 'next/navigation'

const Home = () => {
  const router = useRouter();
  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5 space-y-4'>
      <Button text='オセロ' onClick={() => {
        router.push('/create/othello')
      }}/>
      <Button text='神経衰弱' onClick={() => {
        router.push('/create/shinkei')
      }}/>
      <Button text='Hit&Blow' onClick={() => {
        router.push('create/hitandblow')
      }} />
    </div>
  )
}

export default Home
