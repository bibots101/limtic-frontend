const fs = require('fs');
const path = require('path');

// These are the names of the environment variables you'll set in Vercel
const apiUrl = process.env.API_URL || 'https://localhost:8443/api';
const baseUrl = process.env.BASE_URL || 'https://localhost:8443';

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  baseUrl: '${baseUrl}'
};
`;

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');

console.log('Generating environment.prod.ts...');

try {
  fs.writeFileSync(targetPath, envConfigFile);
  console.log(`Successfully generated environment.prod.ts at ${targetPath}`);
} catch (err) {
  console.error('Error writing environment.prod.ts:', err);
  process.exit(1);
}

