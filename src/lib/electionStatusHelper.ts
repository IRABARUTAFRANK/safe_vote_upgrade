import { db } from "@/lib/db";

/**
 * Automatically update election statuses based on current date and time
 * - DRAFT → ACTIVE when startDate is reached
 * - ACTIVE → CLOSED when endDate is passed
 */
export async function updateElectionStatuses() {
  try {
    const now = new Date();

    // Find elections that should transition to ACTIVE
    const draftElections = await db.election.findMany({
      where: {
        status: "DRAFT",
        startDate: { lte: now },
      },
      select: { id: true },
    });

    if (draftElections.length > 0) {
      await db.election.updateMany({
        where: { id: { in: draftElections.map(e => e.id) } },
        data: { status: "ACTIVE" },
      });
    }

    // Find elections that should transition to CLOSED
    const activeElections = await db.election.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now },
      },
      select: { id: true },
    });

    if (activeElections.length > 0) {
      await db.election.updateMany({
        where: { id: { in: activeElections.map(e => e.id) } },
        data: { status: "CLOSED" },
      });

      // Mark member accounts as dormant when election is closed
      for (const election of activeElections) {
        await db.member.updateMany({
          where: {
            electionId: election.id,
            isActive: true,
          },
          data: { isActive: false },
        });
      }
    }

    return { success: true, draftConverted: draftElections.length, closedConverted: activeElections.length };
  } catch (error) {
    console.error("Update election statuses error:", error);
    return { success: false, error: "Failed to update election statuses" };
  }
}

/**
 * Get elections with automatic status updates
 */
export async function getElectionsWithStatusUpdate(
  where: any,
  include: any,
  orderBy?: any
) {
  // First update any stale statuses
  await updateElectionStatuses();

  // Then fetch the elections
  return db.election.findMany({
    where,
    include,
    orderBy,
  });
}

/**
 * Get a single election with automatic status update
 */
export async function getElectionWithStatusUpdate(
  where: any,
  include: any
) {
  // First update any stale statuses
  await updateElectionStatuses();

  // Then fetch the election
  return db.election.findFirst({
    where,
    include,
  });
}
