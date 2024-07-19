'use client'; 

import React from 'react';
import { api } from '~/trpc/react';

interface Props {
    id: string
}

const EmailDisplay = ({id}: Props) => {

    const {data: emailItem} = api.emails.fetchEmailbyId.useQuery({id})
  return (
    <div className="max-w-5xl mx-auto my-10 p-6 border rounded-lg shadow-lg">
      <div className="flex items-center">
        {/* <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xl font-semibold">{emailItem?.from}</span>
        </div> */}
        <div className="ml-4">
          <div className="text-lg font-semibold">{emailItem?.from}</div>
          <div className="text-sm text-gray-600">{new Date(emailItem?.date ?? "").toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xl font-semibold">{emailItem?.subject}</div>
        <div className="text-gray-800 mt-2" dangerouslySetInnerHTML={{ __html: emailItem?.content ?? "" }}></div>
      </div>
    </div>
  );
};

export default EmailDisplay;
