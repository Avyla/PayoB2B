import vision from '@google-cloud/vision';
import path from 'path';
import { env } from '../config/env';

import fs from 'fs';

const keyFilePath = path.resolve(__dirname, '../..', env.GCP_VISION_KEY_PATH);

const visionOptions: any = {
  projectId: env.GCP_PROJECT_ID,
};

if (fs.existsSync(keyFilePath)) {
  visionOptions.keyFilename = keyFilePath;
}

const client = new vision.ImageAnnotatorClient(visionOptions);

export const extractTextFromImage = async (gcsUriOrBuffer: string | Buffer): Promise<string> => {
  try {
    let request: Parameters<typeof client.textDetection>[0];
    if (typeof gcsUriOrBuffer === 'string') {
      let imageUri = gcsUriOrBuffer;
      // Convert public https URL to gs:// URI for Cloud Vision to bypass bucket ACL issues
      if (imageUri.startsWith('https://storage.googleapis.com/')) {
        const parts = imageUri.replace('https://storage.googleapis.com/', '').split('/');
        const bucket = parts.shift();
        const path = parts.join('/');
        imageUri = `gs://${bucket}/${path}`;
      }
      request = {
        image: { source: { imageUri } },
      };
    } else {
      request = {
        image: { content: gcsUriOrBuffer },
      };
    }

    const [result] = await client.textDetection(request);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return '';
    }

    // The first annotation contains the entire text block
    return detections[0].description || '';
  } catch (error) {
    console.error('❌ OCR Processing Error:', error);
    throw new Error('Failed to extract text from image using Cloud Vision API');
  }
};
