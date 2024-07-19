"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import { redirect } from "next/navigation";
import EmailsList from "./email-list";

const EmailPage = () => {

  const router = useRouter(); 
  const handleSignOut = async () => {
    await signOut(); 
    router.push('/')
  }

  const {data: session} = useSession(); 

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button onClick={handleSignOut} className="mb-4 rounded-md bg-blue-500 px-4 py-2 text-white">
        Sign Out
      </button>
      <div className="mx-auto max-w-3xl rounded-md bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-semibold">Your emails</h1>
        <p className="mb-6 text-gray-600">
          All your emails accessible in one place.
        </p>
        <div className="mb-6 flex space-x-4">
          <button className="rounded-md bg-gray-200 px-4 py-2">
            All inbox
          </button>
          <button className="rounded-md bg-gray-200 px-4 py-2">Gmail</button>
          <button className="rounded-md bg-gray-200 px-4 py-2">Outlook</button>
        </div>
        <button className="mb-4 rounded-md bg-blue-500 px-4 py-2 text-white">
          Add account +
        </button>
        <div
          className="mb-4 border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-700"
          role="alert"
        >
          <p className="font-bold">Heads up!</p>
          <p>
            We are in the process of getting SOC2 Certification. Its safe to
            proceed through the Google Authentication warning screen.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">Gmail</h2>
          <input
            type="text"
            placeholder="Search for file"
            className="mb-4 w-full rounded-md border border-gray-300 p-2"
          />
          <div>
            <EmailsList userId={session?.user.id ?? ""}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPage;
