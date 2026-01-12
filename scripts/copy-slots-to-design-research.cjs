require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    try {
        // Find the Meet for Round 4 of Tech
        const techRound = await prisma.round.findUnique({
            where: {
                domain_number: {
                    domain: "tech",
                    number: 4,
                },
            },
            include: {
                Meet: {
                    include: {
                        Slot: true,
                    },
                },
            },
        });

        if (!techRound) {
            console.error("Round 4 of Tech not found");
            return;
        }

        if (!techRound.Meet) {
            console.error("Meet for Round 4 of Tech not found");
            return;
        }

        const techSlots = techRound.Meet.Slot;
        console.log(`Found ${techSlots.length} slots in Tech Round 4`);

        // Find Round 4 of Design and Research
        const targetDomains = ["design", "research"];

        for (const domain of targetDomains) {
            const targetRound = await prisma.round.findUnique({
                where: {
                    domain_number: {
                        domain,
                        number: 4,
                    },
                },
                include: {
                    Meet: {
                        include: {
                            Slot: true,
                        },
                    },
                },
            });

            if (!targetRound) {
                console.error(`Round 4 of ${domain} not found`);
                continue;
            }

            if (!targetRound.Meet) {
                console.error(`Meet for Round 4 of ${domain} not found`);
                continue;
            }

            const targetMeet = targetRound.Meet;
            console.log(`\nProcessing ${domain} Round 4 (Meet ID: ${targetMeet.id})`);
            console.log(`Existing slots in ${domain}: ${targetMeet.Slot.length}`);

            // Create slots matching Tech's slots
            let createdCount = 0;
            for (const techSlot of techSlots) {
                // Check if a slot with the same from/to times already exists
                const existingSlot = targetMeet.Slot.find(
                    (s) =>
                        s.from.getTime() === techSlot.from.getTime() &&
                        s.to.getTime() === techSlot.to.getTime()
                );

                if (existingSlot) {
                    console.log(
                        `Slot already exists: ${techSlot.from.toISOString()} - ${techSlot.to.toISOString()}`
                    );
                    continue;
                }

                await prisma.slot.create({
                    data: {
                        meetId: targetMeet.id,
                        from: techSlot.from,
                        to: techSlot.to,
                        capacity: techSlot.capacity,
                    },
                });
                createdCount++;
                console.log(
                    `Created slot: ${techSlot.from.toISOString()} - ${techSlot.to.toISOString()} (capacity: ${techSlot.capacity})`
                );
            }

            console.log(`Created ${createdCount} new slots for ${domain}`);
        }

        console.log("\nDone!");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
