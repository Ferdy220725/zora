const { google } = require('googleapis');
const readline = require('readline');

// Ganti dengan Client ID & Secret kamu (yang sama dipakai di route.ts)
const CLIENT_ID = 'ISI_CLIENT_ID_KAMU';
const CLIENT_SECRET = 'ISI_CLIENT_SECRET_KAMU';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // boleh pakai ini sebagai redirect URI, aman

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // penting! supaya refresh_token pasti muncul
  scope: SCOPES,
});

console.log('Buka URL ini di browser, login, lalu copy kode yang muncul:\n');
console.log(authUrl);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('\nPaste kode authorization di sini: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('\n=== TOKENS ===');
  console.log(tokens);
  rl.close();
});