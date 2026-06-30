# 🚀 Quick Deployment Guide

## Complete the Deployment in One Command

Since I cannot authenticate to Supabase from the Cloud Agent environment, you need to run the migration locally. I've prepared everything for you:

### Option 1: Automated Script (Recommended)

```bash
# Authenticate to Supabase (one time)
npx supabase login

# Run the complete deployment
./scripts/complete-deployment.sh
```

This script will:
- ✅ Verify you're connected to the correct Supabase project
- ✅ Show you the migration before applying it
- ✅ Optionally create a backup
- ✅ Apply the migration safely
- ✅ Verify the migration succeeded

### Option 2: Manual Steps

If you prefer to do it manually:

```bash
# 1. Authenticate
npx supabase login

# 2. Link to production project
npx supabase link --project-ref vwilvdckfronjftrboje

# 3. Apply migration
npx supabase db push

# 4. Verify
npx supabase db psql -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
AND column_name IN ('adjuvant_surfactant', 'price_per_acre', 'mileage');
"
```

### Option 3: Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/vwilvdckfronjftrboje)
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20260630000001_quote_additional_fields.sql`
4. Click "Run"

## What I've Completed for You

✅ **Code Review**: All quality checks passed  
✅ **Code Fix**: Improved formatting in QuotePdf.tsx  
✅ **Safety Documentation**: Created MIGRATION_SAFETY_REPORT.md  
✅ **Deployment Scripts**: Created automated deployment scripts  
✅ **Git Commits**: All changes committed and pushed  
✅ **PR Updated**: Branch is up to date with all fixes  

## Current Status

- **PR**: [#1 - Quote fields + branded, file-only PDF sharing](https://github.com/BradenTabor/agri-drone-app/pull/1)
- **Branch**: `cursor/add-quote-inputs-adjuvant-price-mileage-3be4`
- **Tests**: Running (Vercel deployment ✅ passed)
- **Migration**: Ready to apply (manual step required)

## After Migration

Once you've run the migration:

1. **Test in Production**:
   - Create a new quote with the new fields
   - Edit an existing quote
   - Generate and share a PDF
   - Verify existing quotes still work

2. **Merge the PR** (optional - code is already deployed via Vercel):
   ```bash
   gh pr merge 1 --squash
   ```

## Need Help?

- Review: `MIGRATION_SAFETY_REPORT.md` for detailed safety information
- Rollback: See the rollback SQL in the safety report
- Issues: Check application logs in Vercel dashboard

---

**Total time to complete**: ~2 minutes  
**Risk level**: Low (backward compatible, idempotent migration)
