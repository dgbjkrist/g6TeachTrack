import './src/config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import routes from './src/routes/index.js';



const app = express();

const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:8080";
const corsOrigins = process.env.NODE_ENV === 'development'
  ? /^http:\/\/localhost:\d+$/ // Allow any localhost port in dev
  : frontendUrl;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());


// Servir les fichiers statiques (uploads)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));