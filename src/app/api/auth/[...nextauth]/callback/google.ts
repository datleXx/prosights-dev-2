import { NextRequest, NextResponse } from 'next/server';
import { google, Auth } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

const TOKEN_PATH = path.join(process.cwd(), 'token.json');

const CREDENTIALS = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [process.env.GOOGLE_REDIRECT_URI]
};

async function saveCredentials(client: Auth.OAuth2Client): Promise<void> {
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: CREDENTIALS.client_id,
    client_secret: CREDENTIALS.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  console.log('Saving credentials:', payload);
  await fs.writeFile(TOKEN_PATH, payload);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  console.log('Received authorization code:', code);
  console.log('Received state:', state);

  if (!code) {
    console.log('No authorization code found in the URL.');
    return NextResponse.redirect('/');
  }

  const client = new google.auth.OAuth2(
    CREDENTIALS.client_id,
    CREDENTIALS.client_secret,
    CREDENTIALS.redirect_uris[0]
  );

  try {
    const { tokens } = await client.getToken(code);
    console.log('Received tokens:', tokens);
    client.setCredentials(tokens);

    if (tokens.refresh_token) {
      await saveCredentials(client);
      console.log('Tokens saved successfully.');
    } else {
      console.log('No refresh token received.');
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);

    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    return NextResponse.redirect(`/api/auth/signin?error=OAuthCallback&message=${encodeURIComponent(errorMessage)}`);
  }

  return NextResponse.redirect('/');
}
