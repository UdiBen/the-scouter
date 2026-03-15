<!-- CC10x Session Memory - Do not delete sections -->

## Current Focus
- The Scouter - player scouting application
- Recent fix: display name shown in recent searches instead of full name

## Recent Changes
- Fixed RecentSearches.tsx to use `displayName || fullName` instead of `fullName`

## Next Steps
- None pending

## Decisions
- Recent searches should show displayName (consistent with PlayerCard)

## Learnings
- Player data has both `fullName` and `displayName` fields; displayName is optional

## References
- Plan: N/A
- Design: N/A
- Research: N/A

## Blockers
- None

## Last Updated
2026-03-15
