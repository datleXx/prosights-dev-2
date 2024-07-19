import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { gmail_v1, google } from "googleapis";
import { db } from "~/server/db";
import { emails } from "~/server/db/schema"; // Import the emails table schema
import { refreshAccessToken } from "~/lib/google";

interface EmailData {
  id: string;
  userId: string;
  snippet: string;
  subject: string;
  from: string;
  date: Date;
  content: string;
}

function decodeBase64Url(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  switch (base64.length % 4) {
    case 2:
      base64 += "==";
      break;
    case 3:
      base64 += "=";
      break;
  }
  return atob(base64);
}

interface EmailBody {
  text: string;
  html: string;
  attachments: {
    filename: string;
    mimeType: string;
    data: string;
    attachmentId?: string;
  }[];
}

function getBody(message: gmail_v1.Schema$Message) {
  const parts = message.payload?.parts ?? [];
  const result: EmailBody = {
    text: "",
    html: "",
    attachments: [],
  };

  if (message.payload?.body?.data) {
    // Handle non-multipart message
    result.text = decodeBase64Url(message.payload.body.data);
  }

  parts.forEach((part) => {
    if (!part.body?.data) return;

    switch (part.mimeType) {
      case "text/plain":
        result.text += decodeBase64Url(part.body.data);
        break;
      case "text/html":
        result.html += decodeBase64Url(part.body.data);
        break;
      default:
        if (part.filename?.length) {
          if (part.filename.length > 0) {
            // This is an attachment
            result.attachments.push({
              filename: part.filename ?? "",
              mimeType: part.mimeType!,
              data: part.body.data,
              attachmentId: part.body.attachmentId ?? "",
            });
          }
        } else if (part.parts?.length) {
          // Handle nested parts
          const nestedResult = getBody({ payload: part });
          result.text += nestedResult.text;
          result.html += nestedResult.html;
          result.attachments = result.attachments.concat(
            nestedResult.attachments,
          );
        }
        break;
    }
  });

  return result;
}

async function fetchAndProcessMessages(
  gmail: gmail_v1.Gmail,
  userId: string,
): Promise<gmail_v1.Schema$Message[]> {
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
  });
  const messages = response.data.messages ?? [];

  for (const message of messages) {
    if (message.id) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      console.log(msg.data.payload?.mimeType);

      // Extract relevant data from the message
      const dateHeader = msg.data.payload?.headers?.find(
        (header) => header.name === "Date",
      )?.value;

      const emailBody = getBody(msg as gmail_v1.Schema$Message);
      const emailData = {
        id: message.id,
        userId: userId,
        snippet: msg.data.snippet ?? "",
        subject:
          msg.data.payload?.headers?.find((header) => header.name === "Subject")
            ?.value ?? "",
        from:
          msg.data.payload?.headers?.find((header) => header.name === "From")
            ?.value ?? "",
        date: dateHeader ? new Date(dateHeader) : new Date(),
        content: emailBody.text ?? emailBody.html ?? "",
      };

      // Insert or update the email in the database
      await db.insert(emails).values(emailData).onConflictDoUpdate({
        target: emails.id,
        set: emailData,
      });
    }
  }
  return messages;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("Session:", session); // Debugging line

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = session.user?.accessToken;
  const refreshToken = session.user?.refreshToken;
  const userId = session.user?.id;

  if (!accessToken || !refreshToken || !userId) {
    console.error("Missing access, refresh token, or userId", {
      accessToken,
      refreshToken,
      userId,
    });
    return NextResponse.json(
      { error: "Missing access, refresh token, or userId" },
      { status: 400 },
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const messages = await fetchAndProcessMessages(gmail, userId);

    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error("Error accessing Gmail API:", error);

    if (isTokenExpiredError(error)) {
      // Token expired, refresh it
      const newTokens = await refreshAccessToken(refreshToken);
      if (newTokens) {
        const newAccessToken = newTokens.access_token!;

        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI,
        );

        oauth2Client.setCredentials({ access_token: newAccessToken });

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        const messages = await fetchAndProcessMessages(gmail, userId);

        return NextResponse.json({ messages });
      } else {
        return NextResponse.json(
          { error: "Failed to refresh access token" },
          { status: 500 },
        );
      }
    } else if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "Unknown error occurred" },
        { status: 500 },
      );
    }
  }
}

// Helper function to check if the error is a token expiration error
function isTokenExpiredError(error: unknown): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 401
  );
}
