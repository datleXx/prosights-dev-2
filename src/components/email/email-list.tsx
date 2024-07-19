// EmailsList.tsx
import React, { useEffect, useState } from "react";
import EmailCard from "./email-card";
import { api } from "~/trpc/react";



const EmailsList: React.FC = () => {
  const { data: emailsList } = api.emails.fetchEmails.useQuery();

  const renderedEmails = emailsList?.map((email, index) => {
    return (
        <EmailCard
          key={index}
          sender={email.from ?? ""}
          subject={email.subject ?? ""}
          snippet={email.snippet ?? ""}
          date={new Date(email.date ?? "").toLocaleDateString()}
        />
    );
  });

  return (
    <div className="container mx-auto p-4">
      {renderedEmails}
    </div>
  );
};

export default EmailsList;
