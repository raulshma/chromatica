import { UTApi } from 'uploadthing/server';
import config from './uploadthing-config';

// Initialize the UTApi with your UploadThing credentials
export const utapi = new UTApi({
  token: config.uploadthingSecret,
  logLevel: 'Debug',
});

// Export the app ID for URL generation
export const uploadthingAppId = config.uploadthingAppId;
