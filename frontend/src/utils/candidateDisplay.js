/** Resolve "Submitted To" label from API payload (supports multiple backend shapes). */
export function getSubmittedToName(candidate) {
  if (!candidate) return '';
  if (candidate.submitted_to_name) return candidate.submitted_to_name;

  const details = candidate.submitted_to_details;
  if (details?.name) return details.name;
  if (details?.first_name) {
    return `${details.first_name} ${details.last_name || ''}`.trim();
  }

  const st = candidate.submitted_to;
  if (st && typeof st === 'object') {
    const name = `${st.first_name || st.firstName || ''} ${st.last_name || st.lastName || ''}`.trim();
    if (name) return name;
    if (st.email) return st.email;
  }

  return '';
}

/** Resolve "Created By" label from API payload. */
export function getCreatedByName(candidate) {
  if (!candidate) return '';
  if (candidate.created_by_name) return candidate.created_by_name;

  const cb = candidate.created_by;
  if (cb && typeof cb === 'object') {
    const name = `${cb.first_name || cb.firstName || ''} ${cb.last_name || cb.lastName || ''}`.trim();
    if (name) return name;
    if (cb.email) return cb.email;
  }

  return '';
}
