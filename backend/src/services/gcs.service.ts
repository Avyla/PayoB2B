import { Storage } from '@google-cloud/storage';
import path from 'path';
import { env } from '../config/env';

import fs from 'fs';

const keyFilePath = path.resolve(__dirname, '../..', env.GCP_STORAGE_KEY_PATH);

const storageOptions: any = {
  projectId: env.GCP_PROJECT_ID,
};

if (fs.existsSync(keyFilePath)) {
  storageOptions.keyFilename = keyFilePath;
}

const storage = new Storage(storageOptions);

const BUCKET_NAME = env.GCS_BUCKET_NAME || 'payo-receipts';

export const uploadImageToGCS = async (
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> => {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const uniqueFilename = `receipts/${Date.now()}-${filename}`;
    const file = bucket.file(uniqueFilename);

    await file.save(buffer, {
      metadata: {
        contentType: mimetype,
      },
    });

    return `https://storage.googleapis.com/${BUCKET_NAME}/${uniqueFilename}`;
  } catch (error) {
    console.error('❌ Error uploading to GCS:', error);
    throw new Error('Failed to upload image to Cloud Storage');
  }
};

export const generateSignedUrl = async (url: string): Promise<string> => {
  try {
    // If the URL is already a gs:// URI or doesn't match the expected HTTP pattern, return it as is or handle it
    const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
    if (!url.startsWith(prefix)) {
      return url;
    }

    const uniqueFilename = url.replace(prefix, '');
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(uniqueFilename);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 60 minutes
    });

    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    return url; // fallback to original if signing fails
  }
};
