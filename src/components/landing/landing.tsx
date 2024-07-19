'use client'; 

import dynamic from "next/dynamic";

const Landing = () => {

    const SignIn = dynamic(() => import("../authentication/sign-in"), {
        ssr: false,
      });
    return (
        <div> 
            <SignIn /> 
        </div>
    )
}

export default Landing ;