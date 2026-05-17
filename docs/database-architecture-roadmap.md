# Database Architecture Roadmap

This project has a solid product-oriented schema, but it is still in an MVP-to-growth transition. The goal of this roadmap is to move it toward a professional-grade architecture without breaking the running application.

## What "professional-grade" means here

- Clear domain boundaries
- Consistent naming and identity rules
- Stronger invariants in the database, not only in app code
- Dev/staging/prod separation as a first-class operating rule
- Auditability for admin-edited content
- Predictable performance through explicit indexes for real query paths
- Compatibility with the current app while we migrate incrementally

## Current pain points

- Two admin concepts exist: `admin_users` and `storefront_admin_users`
- Course access can exist before `user_id` is linked, which makes downstream progress logic fragile
- Site settings and shared content are concentrated in broad multi-purpose tables
- Some offering content is relational, some is JSON, and the boundary is inconsistent
- There is no formal content revision history for courses and site-managed content
- Dev/live safety depends too much on operator discipline

## Target architecture

### 1. Identity and Access

- Keep one canonical admin identity source
- Treat `user_id` as the stable ownership key where possible
- Keep `customer_email` as a fulfillment/contact field, not the long-term identity anchor
- Add repair/backfill flows so legacy rows are continuously brought up to the canonical model

### 2. Catalog Domain

- `storefront_sections`
- `storefront_offerings`
- `storefront_offering_*` child tables

Principle:
- keep highly edited, queryable structures relational
- keep JSON only for small opaque payloads that are not filtered, joined, or versioned independently

### 3. Course Domain

- `storefront_courses`
- `storefront_course_modules`
- `storefront_course_items`
- `storefront_course_access`
- `storefront_user_course_progress`
- `storefront_user_achievements`

Principle:
- course structure is content
- course access is entitlement
- progress is user state
- achievements are derived milestones

### 4. Content and Settings Domain

Split broad "god table" responsibilities into bounded areas over time:

- brand/theme settings
- footer/newsletter settings
- FAQs
- shared legal/manual content

This does not have to happen in one migration, but it should be the direction.

### 5. Audit and Revisioning

Admin-managed content should eventually support:

- who changed it
- when it changed
- what changed
- rollback to a previous revision

This matters most for:

- courses
- offerings
- site settings

### 6. Environments

Professional-grade architecture requires:

- separate Supabase projects for dev, staging, and production
- separate secrets and storage buckets per environment
- no shared writable production tables for development work

This is an operating requirement, not just a schema preference.

## Migration strategy

### Phase 1: Foundation and Safety

Goals:

- add missing indexes
- standardize `updated_at` maintenance
- add helper functions for identity repair
- avoid breaking current app code

Deliverables:

- `supabase/professionalize_storefront_schema_phase1.sql`

### Phase 2: Identity Consolidation

Goals:

- unify admin identity sources
- reduce reliance on email-only ownership for course progress and access

Changes:

- canonical admin table or view
- explicit admin helper functions
- user-link repair jobs/triggers

Deliverables:

- `supabase/professionalize_storefront_schema_phase2.sql`

### Phase 3: Content Boundaries

Goals:

- reduce oversized multi-purpose tables
- normalize heavily edited JSON structures

Changes:

- split `storefront_global_content`
- move any still-active offering JSON structures into child tables

Deliverables:

- `supabase/professionalize_storefront_schema_phase3.sql`

### Phase 4: Revision History

Goals:

- add revision tables and restore tooling

Changes:

- `storefront_course_revisions`
- `storefront_site_setting_revisions`
- admin actor metadata

### Phase 5: Read Models and Reporting

Goals:

- stabilize admin/reporting queries
- make user profile/course progress views cheap and consistent

Changes:

- materialized views or SQL views for:
  - user course summary
  - offering summary
  - admin notification feed

### Phase 6: Full Content Normalization

Goals:

- split storefront_global_content into domain-specific tables
- normalize FAQ and success story storage
- add proper audit triggers

Changes:

- `storefront_brand_settings`
- `storefront_site_settings`
- `storefront_faq_entries`
- `storefront_success_stories`
- backward-compatible views

Deliverables:

- `supabase/professionalize_storefront_schema_phase6.sql`

### Phase 7: JSON Structure Optimization

Goals:

- replace queryable JSONB with relational tables
- optimize achievement and badge data
- keep JSONB only for opaque payloads (revisions, notifications)

Changes:

- `storefront_achievement_definitions`
- `storefront_user_achievements_v2` (relational version)
- removal of legacy JSONB columns from offerings

Deliverables:

- `supabase/professionalize_storefront_schema_phase7.sql`

### Phase 8: Formal Environment Rules

Goals:

- establish environment-aware database configuration
- implement environment-specific RLS policies
- ensure no production data contaminates development

Changes:

- `storefront_environment_config`
- environment detection functions
- data isolation policies
- audit logging for production
- demo data management for dev/staging

Deliverables:

- `supabase/professionalize_storefront_schema_phase8.sql`

### Phase 9: Application Integration

Goals:

- provide convenient analytics views for admin dashboards
- document TypeScript integration patterns
- enable common admin reporting queries

Changes:

- admin dashboard summary view
- offering performance analytics view
- user learning path view
- content audit trail view
- admin helper functions

Deliverables:

- `supabase/professionalize_storefront_schema_phase9.sql`

## Recommended database rules

- Every mutable operational table should have reliable `updated_at` behavior
- Every major foreign-key lookup path should have a supporting index
- Every user-owned table should have one stable ownership model
- Every admin-edited content domain should eventually support revisions
- No development data should ever rely on manual cleanup in production

## What phase 1 does not solve

- It does not fully normalize content storage
- It does not replace all JSON usage
- It does not split environments for you
- It does not automatically produce revision history

It lays the groundwork so later refactors are safer and cheaper.

## Phases 6-9: Additional Refinements

All refinement phases have been created and are ready for execution:

**Phase 6** - Full Content Normalization
- Splits god table into domain-specific tables
- FAQs, success stories, brand, and site settings now have proper homes
- Backward-compatible views for migration

**Phase 7** - JSON Structure Optimization
- Relational achievement definitions and user achievements
- Removes queryable JSONB structures
- Keeps JSONB only for audit trails and opaque metadata

**Phase 8** - Formal Environment Rules
- Environment detection and isolation
- Demo data management for safe development
- Production audit logging
- Strict separation of dev/staging/prod concerns

**Phase 9** - Application Integration
- Admin dashboard analytics views
- User learning path tracking
- Content audit trail with full revision history
- Helper functions for common admin queries

## Migration checklist

- [x] Phase 1: Foundation and Safety
- [x] Phase 2: Identity Consolidation
- [x] Phase 3: Content Boundaries
- [x] Phase 4: Revision History
- [x] Phase 5: Read Models and Reporting
- [ ] Phase 6: Full Content Normalization
- [ ] Phase 7: JSON Structure Optimization
- [ ] Phase 8: Formal Environment Rules
- [ ] Phase 9: Application Integration

## Next steps

1. Run Phases 6-9 migrations in order
2. Update application code to use new tables and views
3. Test admin dashboards with new analytics views
4. Verify environment isolation is working
5. Set up automated materialized view refresh
6. Document admin dashboard usage for team