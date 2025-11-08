import { UTApi } from 'uploadthing/server';
import config from './uploadthing-config';

// Validate config before initializing UTApi
if (!config.uploadthingSecret) {
  throw new Error('UPLOADTHING_TOKEN is not configured');
}

// Initialize the UTApi with your UploadThing credentials
export const utapi = new UTApi({
  token: config.uploadthingSecret,
  logLevel: 'Debug',
});

// Export the app ID for URL generation
export const uploadthingAppId = config.uploadthingAppId;

// Log the configuration status (without exposing secrets)
console.log(
  'UploadThing initialized with app ID:',
  uploadthingAppId ? config.uploadthingAppId : 'Not configured',
);
console.log('UploadThing secret configured:', !!config.uploadthingSecret);
