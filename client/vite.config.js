import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Listen on every interface so http://localhost:5173 works whether the
    // browser resolves "localhost" to 127.0.0.1 (IPv4) or ::1 (IPv6).
    host: true,
    // Fail loudly instead of silently moving to another port if 5173 is busy.
    strictPort: true,
  },
});
