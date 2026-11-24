import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors:
        process.env.STORE_CORS ||
        'http://127.0.0.1:3001,http://localhost:3001,http://127.0.0.1:3000,http://localhost:3000',
      adminCors:
        process.env.ADMIN_CORS ||
        'http://localhost:5173,http://localhost:9000,http://127.0.0.1:9000',
      authCors:
        process.env.AUTH_CORS ||
        'http://127.0.0.1:3001,http://localhost:3001,http://localhost:9000,http://127.0.0.1:9000',
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    storefrontUrl: process.env.STOREFRONT_URL || 'http://127.0.0.1:3001',
  },
  modules: [
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/notification-local',
            id: 'local',
            options: {
              channels: ['email'],
            },
          },
        ],
      },
    },
  ],
})
