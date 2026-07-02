const path = require('path');

const VISION_KEY = path.resolve(__dirname, '..', 'gcp-vision-key.json');
const STORAGE_KEY = path.resolve(__dirname, '..', 'gcp-storage-key.json');
const PROJECT_ID = 'payo-500801';
const BUCKET_NAME = 'payo-receipts';

async function testVision() {
  console.log('🔍 Testing Cloud Vision API...');
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient({
    keyFilename: VISION_KEY,
    projectId: PROJECT_ID,
  });

  // Tiny valid 1x1 white PNG in base64
  const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
  const [result] = await client.textDetection({
    image: { content: Buffer.from(TINY_PNG, 'base64') },
  });
  const text = result.textAnnotations?.[0]?.description ?? '(no text detected)';
  console.log('✅ Vision API: Connected! Extracted text:', text);
}

async function testStorage() {
  console.log('🗄️  Testing Cloud Storage...');
  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage({ keyFilename: STORAGE_KEY, projectId: PROJECT_ID });

  const bucket = storage.bucket(BUCKET_NAME);
  const [exists] = await bucket.exists();
  if (!exists) {
    console.log(`❌ Bucket "${BUCKET_NAME}" does not exist.`);
    return;
  }

  const testFile = bucket.file('_connection-test.txt');
  await testFile.save('payo-gcs-ok', { metadata: { contentType: 'text/plain' } });
  await testFile.delete();
  console.log(`✅ GCS Storage: Connected! Bucket "${BUCKET_NAME}" is accessible.`);
}

Promise.all([testVision(), testStorage()])
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
