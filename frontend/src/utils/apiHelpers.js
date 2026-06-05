/** Normalize API list responses (plain array or DRF `{ results }`). */
export function asList(response) {
  if (Array.isArray(response)) return response;
  if (response?.results && Array.isArray(response.results)) return response.results;
  return [];
}
