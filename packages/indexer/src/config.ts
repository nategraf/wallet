import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const VERSION = process.env.GAE_VERSION
export const ENVIRONMENT = process.env.ENVIRONMENT
export const PORT = Number(process.env.PORT) || 8080
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE
export const INVITES_POLLING_INTERVAL = Number(process.env.INVITES_POLLING_INTERVAL) || 60000
export const ACCOUNTS_POLLING_INTERVAL = Number(process.env.ACCOUNTS_POLLING_INTERVAL) || 60000
export const ATTESTATIONS_POLLING_INTERVAL =
  Number(process.env.ATTESTATIONS_POLLING_INTERVAL) || 60000
export const TRANSFERS_POLLING_INTERVAL = Number(process.env.TRANSFERS_POLLING_INTERVAL) || 5000

export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL || 'UNDEFINED'

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
export const FIREBASE_DB = `https://${FIREBASE_PROJECT_ID}.firebaseio.com`
export function getFirebaseAdminCreds(admin: any) {
  if (ENVIRONMENT === 'local') {
    try {
      const serviceAccount = require('../config/serviceAccountKey.json')
      return admin.credential.cert(serviceAccount)
    } catch (error) {
      console.error(
        'Error: Could not initialize admin credentials. Is serviceAccountKey.json missing?',
        error
      )
    }
  } else {
    try {
      return admin.credential.applicationDefault()
    } catch (error) {
      console.error('Error: Could not retrieve default app creds', error)
    }
  }
}
