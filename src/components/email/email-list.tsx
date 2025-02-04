'use client'; 


import React, { useEffect, useState } from "react";
import EmailCard from "./email-card";
import { api } from "~/trpc/react";
import Link from "next/link";

interface EmailsListProps {
  userId: string
}

const EmailsList = ({userId}: EmailsListProps) => {
  const { data: emailsList } = api.emails.fetchEmails.useQuery({userId});

  const renderedEmails = emailsList?.map((email, index) => {
    return (
      <Link key={index} href={`/email/${email.id}`}>
        <EmailCard
          key={index}
          sender={email.from ?? ""}
          subject={email.subject ?? ""}
          snippet={email.snippet ?? ""}
          date={new Date(email.date ?? "").toLocaleDateString()}
        />
      </Link>
    );
  });

  return <div className="container mx-auto p-4">{renderedEmails}</div>;
};

export default EmailsList;
