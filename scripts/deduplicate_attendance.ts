import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Finding duplicates...')

    // Group by userId and date
    const groups = await prisma.attendance.groupBy({
        by: ['userId', 'date'],
        _count: {
            id: true
        },
        having: {
            id: {
                _count: {
                    gt: 1
                }
            }
        }
    })

    console.log(`Found ${groups.length} groups with duplicates.`)

    for (const group of groups) {
        const { userId, date } = group
        console.log(`Cleaning duplicates for User ${userId} on Date ${date}...`)

        // Get all records for this pair
        const records = await prisma.attendance.findMany({
            where: { userId, date },
            orderBy: { updatedAt: 'desc' } // Keep the most recently updated one
        })

        const [keep, ...toDelete] = records
        console.log(`Keeping record ${keep.id}, deleting ${toDelete.length} duplicates.`)

        for (const record of toDelete) {
            await prisma.attendance.delete({
                where: { id: record.id }
            })
        }
    }

    console.log('Deduplication complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
