import React from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from './ui/button';
import { ArrowLeft, CarFront, Heart, Layout } from 'lucide-react';
import { checkUser } from '@/lib/checkUser';


const Header =  async ({ isAdminPage = false }) => {

  const user = await checkUser()
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className='fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b'>
        <nav className='mx-auto px-4 py-4 flex items-center justify-between'>
            <Link href={isAdminPage ? '/admin' : '/'} className='flex items-center gap-x-2'>
              <Image
                src={'/logo.png'}
                alt='company logo'
                width={200}
                height={60}
                className='h-12 w-auto object-contain'
              />
              {isAdmin && (
                <span className='text-xs font-extralight'>admin</span>
              )}
            </Link>

            <div className='flex items-center gap-x-4'>
              <Show when='signed-in'>
                
                {isAdminPage ? (
                  <Link href='/'>
                    <Button variant='outline'>
                      <ArrowLeft size={18}/>

                      <span>Back to App</span>
                    </Button>
                  </Link>
                ) : (
                <>
                  <Link href='/saved-cars'>
                    <Button>
                      <Heart size={18}/>

                      <span className='hidden md:inline'>Saved Cars</span>
                    </Button>
                  </Link>
                
                  {!isAdmin ? (
                    <Link href='/reservation'>
                      <Button variant='outline'>
                        <CarFront size={18}/>

                        <span className='hidden md:inline'>My Reservations</span>
                      </Button>
                    </Link> 
                  ) : (
                    <Link href='/admin'>
                      <Button variant='outline'>
                        <Layout size={18}/>

                        <span className='hidden md:inline'>Admin Portal</span>
                      </Button>
                    </Link>
                  )}
                </>
                )}
              </Show>

              <Show when='signed-out'>
                <SignInButton forceRedirectUrl='/'>
                  <Button variant='outline'>Login</Button>
                </SignInButton>
              </Show>

              <Show when='signed-in'>
                <UserButton appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10',
                  },
                }} />
              </Show>
            </div>
        </nav>
    </header>
  )
}

export default Header;