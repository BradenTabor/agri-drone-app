## Agri Drone Operations Platform

Source of truth spec: `agri_drone_app_build_plan.md`

**Supabase environments:** Prod and dev share one project (`vwilvdckfronjftrboje`) — see [`docs/SUPABASE_ENVIRONMENTS.md`](docs/SUPABASE_ENVIRONMENTS.md) before linking CLI or running migrations.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Phase 0 scaffolding includes:
- Next.js app shell
- shadcn/ui setup
- Supabase project config in `supabase/`
- Initial migration at `supabase/migrations/20260529010231_0001_initial.sql`
