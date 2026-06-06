import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { createPix, readPixBody } from './server/pix'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [
    tailwindcss(),
    {
      name: 'local-pix-api',
      configureServer(server) {
        // Simple mock/proxy for tracking pixel to avoid CORS errors in dev
        server.middlewares.use('/tracking/v1/events', (req, res) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.end()
            return
          }

          let raw = ''
          req.on('data', (c) => (raw += c))
          req.on('end', () => {
            console.log('[local-tracking] received:', { method: req.method, body: raw })
            res.statusCode = 204
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end()
          })
        })

        server.middlewares.use('/api/pix/create', (req, res) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.end()
            return
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Metodo nao permitido.' }))
            return
          }

          let rawBody = ''

          req.on('data', (chunk) => {
            rawBody += chunk
          })

          req.on('end', async () => {
            try {
              let parsedBody
              try {
                parsedBody = readPixBody(rawBody)
              } catch (e) {
                console.error('Falha ao parsear body JSON:', rawBody)
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Corpo da requisicao invalido JSON.' }))
                return
              }

              console.log('[local-pix-api] request body:', parsedBody)
              console.log('[local-pix-api] env:', {
                BUCKPAY_API_URL: !!env.BUCKPAY_API_URL,
                BUCKPAY_API_KEY: !!env.BUCKPAY_API_KEY,
                BUCKPAY_USER_AGENT: !!env.BUCKPAY_USER_AGENT,
              })

              // Normalize fields (amount may come as string with comma)
              if (parsedBody && typeof parsedBody === 'object') {
                const pb: any = parsedBody as any
                if (pb.amount && typeof pb.amount === 'string') {
                  const normalized = pb.amount.replace(',', '.')
                  const n = Number(normalized)
                  if (!Number.isNaN(n)) pb.amount = n
                }
              }

              const result = await createPix(parsedBody, {
                BUCKPAY_API_URL: env.BUCKPAY_API_URL,
                BUCKPAY_API_KEY: env.BUCKPAY_API_KEY,
                BUCKPAY_USER_AGENT: env.BUCKPAY_USER_AGENT,
              })

              console.log('[local-pix-api] result:', result)

              // Ensure CORS headers on response for convenience in dev
              res.statusCode = result.status
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(JSON.stringify(result.body))
            } catch (error) {
              console.error('Erro interno Pix local:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Erro interno do servidor.' }))
            }
          })
        })
      },
    },
  ],
  }
})
