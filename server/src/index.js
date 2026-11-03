import 'dotenv/config';
import { createStore } from './store/index.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 8080;
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

const store = await createStore(process.env.MONGODB_URI);
const app = createApp(store, { origins });

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port} (allowed origins: ${origins.join(', ')})`);
});
