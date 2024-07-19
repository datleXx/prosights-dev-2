import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/server/auth';
import { google } from 'googleapis';
import { db } from '~/server/db';
import { emails } from '~/server/db/schema'; // Import the emails table schema
import { refreshAccessToken } from '~/lib/google'; 

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log('Session:', session); // Debugging line

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = session.user?.accessToken;
  const refreshToken = session.user?.refreshToken;
  const userId = session.user?.id;

  if (!accessToken ?? !refreshToken ?? !userId) {
    console.error('Missing access, refresh token, or userId', { accessToken, refreshToken, userId });
    return NextResponse.json({ error: 'Missing access, refresh token, or userId' }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.list({ userId: 'me' });

    const messages = response.data.messages ?? [];

    for (const message of messages) {
      if (message.id) {
        const msg = await gmail.users.messages.get({ userId: 'me', id: message.id });

        // Extract relevant data from the message
        const dateHeader = msg.data.payload?.headers?.find(header => header.name === 'Date')?.value;
        const emailData = {
          id: message.id,
          userId: userId,
          snippet: msg.data.snippet ?? '',
          subject: msg.data.payload?.headers?.find(header => header.name === 'Subject')?.value ?? '',
          from: msg.data.payload?.headers?.find(header => header.name === 'From')?.value ?? '',
          date: dateHeader ? new Date(dateHeader) : new Date(),
        };

        // Insert or update the email in the database
        await db.insert(emails).values(emailData).onConflictDoUpdate({
          target: emails.id,
          set: emailData,
        });
      }
    }

    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error('Error accessing Gmail API:', error);

    if (isTokenExpiredError(error)) {
      // Token expired, refresh it
      const newTokens = await refreshAccessToken(refreshToken);
      if (newTokens) {
        const accessToken = newTokens.access_token!;

        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const response = await gmail.users.messages.list({ userId: 'me' , maxResults: 10});
        const messages = response.data.messages ?? [];

        for (const message of messages) {
          if (message.id) {
            const msg = await gmail.users.messages.get({ userId: 'me', id: message.id });

            // Extract relevant data from the message
            const dateHeader = msg.data.payload?.headers?.find(header => header.name === 'Date')?.value;
            const emailData = {
              id: message.id,
              userId: userId,
              snippet: msg.data.snippet ?? '',
              subject: msg.data.payload?.headers?.find(header => header.name === 'Subject')?.value ?? '',
              from: msg.data.payload?.headers?.find(header => header.name === 'From')?.value ?? '',
              date: dateHeader ? new Date(dateHeader) : new Date(),
            };

            // Insert or update the email in the database
            await db.insert(emails).values(emailData).onConflictDoUpdate({
              target: emails.id,
              set: emailData,
            });
          }
        }

        return NextResponse.json({ messages });
      } else {
        return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 500 });
      }
    } else if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
    }
  }
}

// Helper function to check if the error is a token expiration error
function isTokenExpiredError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 401;
}
