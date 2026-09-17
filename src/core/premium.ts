export type Plan = "free" | "pro";

export const FREE_SEASON_LIMIT = 1;
export const FREE_TEAM_LIMIT = 1;

export function canCreateSeason(
  seasonCount: number,
  plan: Plan = "free",
): boolean {
  return plan === "pro" || seasonCount < FREE_SEASON_LIMIT;
}

export function canCreateTeam(teamCount: number, plan: Plan = "free"): boolean {
  return plan === "pro" || teamCount < FREE_TEAM_LIMIT;
}
