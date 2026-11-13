/**
 * Returns combat events not yet presented by a consumer. Sequence numbers
 * survive the bounded event history, so a long-lived Phaser scene does not
 * replay old damage when the oldest events are evicted.
 */
export function getServerCombatEventsAfter(world, lastSequence = 0) {
  if (!world || !Array.isArray(world.combatEvents)) {
    return { events: [], lastSequence: Number.isInteger(lastSequence) ? lastSequence : 0 };
  }
  const requestedCursor = Number.isInteger(lastSequence) ? lastSequence : 0;
  const worldSequence = Number.isInteger(world.combatEventSequence) ? world.combatEventSequence : 0;
  // A newly connected protocol session starts its event sequence at zero.
  const cursor = worldSequence < requestedCursor ? 0 : requestedCursor;
  const events = world.combatEvents.filter(event =>
    Number.isInteger(event.sequence) && event.sequence > cursor);
  return {
    events,
    lastSequence: Math.max(cursor, worldSequence,
      ...events.map(event => event.sequence)),
  };
}
