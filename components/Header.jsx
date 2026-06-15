import React from 'react'
import Link from 'next/link';
import Image from 'next/image';


const Header = ({ isAdminPage = true }) => {

  const isAdmin = true;

  return (
    <header className='fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b'>
        <nav className='mx-auto px-4 py-4 flex items-center justify-between'>
            <Link href={isAdminPage ? '/admin' : '/'}>
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

            
        </nav>
    </header>
  )
}

export default Header;