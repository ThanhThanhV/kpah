/**
 * Returns combat events not yet presented by a consumer. Sequence numbers
 * survive the bounded event history, so a long-lived Phaser scene does not
 * replay old damage when the oldest events are evicted.
 */
export function getServerCombatEventsAfter(world, lastSequence = 0) {
  if (!world || !Array.isArray(world.combatEvents)) {
    return { events: [], lastSequence: Number.isInteger(lastSequence) ? lastSequence : 0 };
  }
  const cursor = Number.isInteger(lastSequence) ? lastSequence : 0;
  const events = world.combatEvents.filter(event =>
    Number.isInteger(event.sequence) && event.sequence > cursor);
  return {
    events,
    lastSequence: Math.max(cursor, world.combatEventSequence ?? 0,
      ...events.map(event => event.sequence)),
  };
}
