'use client'; 

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SignIn = () => {

  const {data: session, status} = useSession(); 
  const router = useRouter(); 

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status, router]);

  const handleSignIn = async () => {
    try {
      await signIn('google')
    }
    catch (e) {
      console.log("Error", e); 
    }
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <button
        className="px-4 py-2 mt-4 text-white bg-blue-500 rounded"
        onClick={handleSignIn}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default SignIn;
