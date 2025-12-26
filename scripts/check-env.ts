
import * as dotenv from 'dotenv'
dotenv.config()

console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL)
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...')
} else {
    console.log('Current env keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')))
}
