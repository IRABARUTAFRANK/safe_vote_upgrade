# Merge Conflict Resolution Plan

## Key Decisions:
- **Org Code Format**: SV-XXXX (4 chars, first 2 = last 2 identity pattern)
- **Rate Limit Window**: 15 minutes (incoming branch)
- **Delete Organisation**: KEEP from HEAD
- **Charts**: KEEP from HEAD
- **UI Links**: Add "Our Team" link, remove footer credit

## Files to Resolve:

### Core Library Files
- [ ] 1. src/lib/security.ts - Rate limits & org code validation
- [ ] 2. src/lib/orgCode.ts - Code generation (SV-XXXX format)

### Server Actions
- [ ] 3. src/app/register/actions.ts - Member code generation
- [ ] 4. src/app/superadmin/dashboard/actions.ts - Full resolution
- [ ] 5. src/app/organisation/login/actions.ts - Function signature

### Pages & Components
- [ ] 6. src/app/page.tsx - Navigation links
- [ ] 7. src/app/layout.tsx - Hydration settings
- [ ] 8. src/app/organisation/login/page.tsx - Placeholder text
- [ ] 9. src/app/organisation/pending/PendingClient.tsx - UI changes
- [ ] 10. src/app/vote/login/page.tsx - Login link
- [ ] 11. src/app/register/page.tsx - Messages & links
- [ ] 12. src/app/superadmin/dashboard/DashboardClient.tsx - Full resolution
- [ ] 13. src/app/organisation/dashboard/DashboardClient.tsx - Full resolution
- [ ] 14. src/app/components/ThemeToggle.tsx - Theme settings
- [x] 15. src/app/superadmin/dashboard/org/[id]/OrganisationDetailClient.tsx - Code generation UI
- [ ] 16. src/app/organisation/dashboard/page.tsx - Dashboard data

## Resolution Strategy:
1. Use `edit_file` to resolve each conflict by keeping the appropriate version
2. Prioritize SV-XXXX format for org codes
3. Keep delete functionality in superadmin dashboard
4. Keep chart components in org dashboard

