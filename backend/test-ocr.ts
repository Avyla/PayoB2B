import { ImageAnnotatorClient } from '@google-cloud/vision';
import path from 'path';

async function main() {
  const client = new ImageAnnotatorClient({
    projectId: process.env.GCP_PROJECT_ID || 'payo-500801',
    keyFilename: path.resolve(__dirname, 'gcp-vision-key.json'),
  });
  const [result] = await client.textDetection('/tmp/test-receipt2.jpg');
  const detections = result.textAnnotations;
  console.log(detections ? detections[0]?.description : 'No text detected');
}
main();
