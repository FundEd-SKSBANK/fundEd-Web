
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()


async function main() {
  console.log('🗑️  Starting database cleanup...')

  try {
    // 1. Delete dependent records first (to satisfy foreign keys)
    
    // Delete all Payments (depends on Student and Event)
    const deletedPayments = await prisma.payment.deleteMany({})
    console.log(`✅ Deleted ${deletedPayments.count} payments.`)

    // Delete all PrintDistributions (depends on Student and Event)
    const deletedPrints = await prisma.printDistribution.deleteMany({})
    console.log(`✅ Deleted ${deletedPrints.count} print distributions.`)

    // 2. Delete main entities
    
    // Delete all QR Codes (Independent)
    const deletedQrs = await prisma.qrCode.deleteMany({})
    console.log(`✅ Deleted ${deletedQrs.count} QR codes.`)

   // Delete all Students (Now safe as payments/prints are gone)
   // Note: If there are other relations, check schema.
    const deletedStudents = await prisma.student.deleteMany({})
    console.log(`✅ Deleted ${deletedStudents.count} students.`)

    // Delete all Events
    // Note: If events have other dependencies not covered, handle them.
    const deletedEvents = await prisma.event.deleteMany({})
    console.log(`✅ Deleted ${deletedEvents.count} events.`)
    
    console.log('✨ Database cleanup completed successfully! (User table preserved)')

  } catch (error) {
    console.error('❌ Error cleaning database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
