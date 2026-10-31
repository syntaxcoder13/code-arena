import { config } from 'dotenv';
// Local development must never silently load the pasted OpenSourceHub .env.
// Production supplies its own environment (or a Code Arena .env).
config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' });
