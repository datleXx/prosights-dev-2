// EmailCard.tsx
import React from 'react';

interface EmailCardProps {
  sender: string;
  subject: string;
  snippet: string;
  date: string;
}

const EmailCard: React.FC<EmailCardProps> = ({ sender, subject, snippet, date }) => {
  return (
    <div className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-100">
      <input type="checkbox" className="mr-2" />
      <div className="flex-grow">
        <div className="flex justify-between">
          <span className="font-semibold">{sender}</span>
          <span className="text-sm text-gray-500">{date}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">{subject}</span>
          <span className="text-sm text-gray-500">{snippet}</span>
        </div>
      </div>
    </div>
  );
};

export default EmailCard;
