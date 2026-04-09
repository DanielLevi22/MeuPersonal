const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

// Load .env manually since we might not have dotenv installed per se, or just read the file
const envPath = path.resolve(__dirname, '../.env');
let apiKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.*)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.error('Could not read .env', e);
  process.exit(1);
}

if (!apiKey) {
  console.error('API Key not found in .env');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https
  .get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.error) {
          console.error('API Error:', json.error);
        } else if (json.models) {
          console.log('Available Models:');
          json.models.forEach((m) => {
            console.log(`- ${m.name} (${m.displayName})`);
          });
        } else {
          console.log('No models found or unexpected format:', json);
        }
      } catch (e) {
        console.error('Parse error', e, data);
      }
    });
  })
  .on('error', (e) => {
    console.error('Request error', e);
  });
