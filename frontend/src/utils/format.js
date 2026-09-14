export function isPresent(value) {
  return value !== null && value !== undefined && value !== '';
}

export function formatDaysFromHours(hours) {
  if (!isPresent(hours) || Number.isNaN(Number(hours))) return null;
  return `${(Number(hours) / 24).toFixed(1)} days`;
}

export function formatHours(hours) {
  if (!isPresent(hours) || Number.isNaN(Number(hours))) return null;
  const n = Number(hours);
  if (n < 24) return `${n.toFixed(1)} h`;
  return `${(n / 24).toFixed(1)} days`;
}

export function formatKg(kg) {
  if (!isPresent(kg) || Number.isNaN(Number(kg))) return null;
  return `${Number(kg).toLocaleString()} kg`;
}

export function formatPercent(value) {
  if (!isPresent(value) || Number.isNaN(Number(value))) return null;
  return `${Math.round(Number(value))}%`;
}

export function formatMoney(value) {
  if (!isPresent(value)) return null;
  if (typeof value === 'string') return value;
  if (Number.isNaN(Number(value))) return null;
  return `$${Number(value).toLocaleString()}`;
}

export function display(value, fallback = '—') {
  return isPresent(value) ? value : fallback;
}

export function storageAgeLabel(harvestDate, arrivalDate) {
  const raw = harvestDate || arrivalDate;
  if (!raw) return null;
  const then = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.max(0, (Date.now() - then.getTime()) / 86400000);
  return `${days.toFixed(1)} days`;
}

export function parseRecoveredValue(value) {
  if (!isPresent(value)) return 0;
  if (typeof value === 'number') return value;
  const match = String(value).replace(/,/g, '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

export function needsAction(batch) {
  if (!batch) return false;
  const rerouteStatus = String(batch.rerouteStatus || batch.reroute_status || '').toLowerCase();
  const isRerouted = batch.isRerouted ?? batch.is_rerouted;
  const rerouteRequired = batch.rerouteRequired ?? batch.reroute_required;
  const actionStatus = String(batch.recommendedAction?.status || '').toUpperCase();
  if (isRerouted === true || rerouteRequired === false || ['completed', 'approved'].includes(rerouteStatus) || actionStatus === 'APPROVED') {
    return false;
  }
  const risk = batch.riskLevel;
  const infeasible = batch.currentRoute && batch.currentRoute.isFeasible === false;
  const action = batch.recommendedAction || {};
  const pendingReroute =
    action.status === 'PENDING_APPROVAL' &&
    action.actionType &&
    action.actionType !== 'PROCEED_AS_PLANNED';
  return risk === 'CRITICAL' || risk === 'HIGH' || infeasible || pendingReroute;
}

export function transitHoursFromDestination(dest) {
  if (!dest) return null;
  if (isPresent(dest.travelTimeMinutes)) return Number(dest.travelTimeMinutes) / 60;
  if (isPresent(dest.transitDurationHours)) return Number(dest.transitDurationHours);
  return null;
}

export function destinationFeasibility(batch, dest) {
  const rsl = Number(batch?.remainingShelfLifeHours);
  const transit = transitHoursFromDestination(dest);
  if (!Number.isFinite(rsl) || !Number.isFinite(transit)) {
    return { feasible: null, reason: 'Feasibility data is not available from the backend.' };
  }
  const feasible = transit < rsl;
  return {
    feasible,
    transitHours: transit,
    reason: feasible
      ? `Travel time (${transit.toFixed(1)} h) is within remaining shelf life (${rsl.toFixed(1)} h).`
      : 'Travel time exceeds remaining shelf life.',
  };
}

export function isProduceCompatible(batch, dest) {
  const preferred = dest?.preferredProduce;
  if (!Array.isArray(preferred) || preferred.length === 0) return null;
  const produce = String(batch?.produce || '').toLowerCase();
  const ok = preferred.some((p) => {
    const token = String(p).toLowerCase();
    return token.includes('all fresh') || produce.includes(token) || token.includes(produce);
  });
  return ok;
}
