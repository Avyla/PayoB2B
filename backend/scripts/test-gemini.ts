import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar las variables de entorno desde el archivo .env raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testGeminiConnection() {
  console.log('Iniciando prueba de conexión con Gemini/Vertex AI...');
  console.log('----------------------------------------------------');
  
  let ai: GoogleGenAI;
  
  // Imprimir configuración detectada
  if (process.env.GEMINI_API_KEY) {
    console.log('✅ Método de autenticación detectado: GEMINI_API_KEY directa.');
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } else {
    console.log('✅ Método de autenticación detectado: Vertex AI Fallback.');
    console.log(`   - GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID || 'payo-500801'}`);
    console.log(`   - GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('❌ ERROR: No se encontró la variable GOOGLE_APPLICATION_CREDENTIALS en el .env');
      return;
    }
    
    ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GCP_PROJECT_ID || 'payo-500801',
      location: 'us-central1'
    });
  }

  const prompt = `Responde únicamente con la palabra "CONECTADO" si puedes leer este mensaje.`;
  console.log(`\nEnviando prompt de prueba a gemini-2.0-flash...`);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
      }
    });

    console.log('\n----------------------------------------------------');
    if (response.text) {
      console.log('✅ ¡Conexión exitosa!');
      console.log(`Respuesta del modelo: "${response.text.trim()}"`);
    } else {
      console.log('⚠️ La conexión pareció funcionar pero el modelo no devolvió texto.');
    }
    console.log('----------------------------------------------------');
    
  } catch (error) {
    console.error('\n❌ Error durante la conexión con Gemini/Vertex AI:');
    console.error(error instanceof Error ? error.message : String(error));
  }
}

testGeminiConnection();
