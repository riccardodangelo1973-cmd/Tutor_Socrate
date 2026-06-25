import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'vite-plugin-vercel-api-dev',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/chat')) {
              try {
                // Collect request body
                let bodyStr = '';
                await new Promise<void>((resolve, reject) => {
                  req.on('data', chunk => {
                    bodyStr += chunk;
                  });
                  req.on('end', () => {
                    resolve();
                  });
                  req.on('error', err => {
                    reject(err);
                  });
                });

                let parsedBody = {};
                if (bodyStr) {
                  try {
                    parsedBody = JSON.parse(bodyStr);
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }

                // Mock req.body
                (req as any).body = parsedBody;

                // Mock res.status and res.json
                const mockRes = {
                  status(code: number) {
                    res.statusCode = code;
                    return mockRes;
                  },
                  json(data: any) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return mockRes;
                  },
                  setHeader(name: string, value: string) {
                    res.setHeader(name, value);
                    return mockRes;
                  }
                };

                // Load the API handler dynamically using ssrLoadModule
                const handlerModule = await server.ssrLoadModule('./api/chat.ts');
                const handler = handlerModule.default || handlerModule;

                await handler(req, mockRes);
              } catch (err: any) {
                console.error("Vite API Middleware Error:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || "Internal Server Error in Vite Middleware" }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
