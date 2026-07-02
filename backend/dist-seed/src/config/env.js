"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function requireEnv(key) {
    var val = process.env[key];
    if (!val) {
        console.error("\u274C Missing required environment variable: ".concat(key));
        process.exit(1);
    }
    return val;
}
exports.env = {
    PORT: (_a = process.env['PORT']) !== null && _a !== void 0 ? _a : '3001',
    NODE_ENV: ((_b = process.env['NODE_ENV']) !== null && _b !== void 0 ? _b : 'development'),
    DATABASE_URL: requireEnv('DATABASE_URL'),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    GCP_PROJECT_ID: (_c = process.env['GCP_PROJECT_ID']) !== null && _c !== void 0 ? _c : '',
    GCS_BUCKET_NAME: (_d = process.env['GCS_BUCKET_NAME']) !== null && _d !== void 0 ? _d : '',
    GCP_VISION_KEY_PATH: (_e = process.env['GCP_VISION_KEY_PATH']) !== null && _e !== void 0 ? _e : './gcp-vision-key.json',
    GCP_STORAGE_KEY_PATH: (_f = process.env['GCP_STORAGE_KEY_PATH']) !== null && _f !== void 0 ? _f : './gcp-storage-key.json',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: (_g = process.env['WHATSAPP_WEBHOOK_VERIFY_TOKEN']) !== null && _g !== void 0 ? _g : '',
    WHATSAPP_API_TOKEN: (_h = process.env['WHATSAPP_API_TOKEN']) !== null && _h !== void 0 ? _h : '',
};
