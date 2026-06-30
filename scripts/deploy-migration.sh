#!/bin/bash
set -e

echo "============================================"
echo "Agri Drone App - Migration Deployment Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify Supabase project
echo "Step 1: Verifying Supabase project connection..."
echo ""

PROJECT_LIST=$(npx supabase projects list --output json 2>&1)

if echo "$PROJECT_LIST" | grep -q "LegacyPlatformAuthRequiredError"; then
    echo -e "${RED}ERROR: Not authenticated to Supabase CLI${NC}"
    echo ""
    echo "Please run: npx supabase login"
    echo "Then run this script again."
    exit 1
fi

EXPECTED_PROJECT="vwilvdckfronjftrboje"

if echo "$PROJECT_LIST" | grep -q "$EXPECTED_PROJECT"; then
    echo -e "${GREEN}✓ Found project: $EXPECTED_PROJECT${NC}"
else
    echo -e "${RED}ERROR: Expected project $EXPECTED_PROJECT not found${NC}"
    echo ""
    echo "Available projects:"
    echo "$PROJECT_LIST"
    exit 1
fi

# Step 2: Check for wrong projects (safety check)
echo ""
echo "Step 2: Safety check - verifying not connected to wrong projects..."

WRONG_PROJECTS=("emqqxfzahmwnehxcpxzp" "wxftkrdwvzpggjrdntdf")

for wrong_project in "${WRONG_PROJECTS[@]}"; do
    CURRENT_PROJECT=$(cat .git/config 2>/dev/null | grep "project-ref" | cut -d= -f2 | tr -d ' ' || echo "")
    if [ "$CURRENT_PROJECT" = "$wrong_project" ]; then
        echo -e "${RED}ERROR: Connected to wrong project: $wrong_project${NC}"
        echo ""
        echo "Expected: $EXPECTED_PROJECT"
        echo "Current:  $CURRENT_PROJECT"
        echo ""
        echo "Please run: npx supabase link --project-ref $EXPECTED_PROJECT"
        exit 1
    fi
done

echo -e "${GREEN}✓ Safety check passed${NC}"

# Step 3: Show migration to be applied
echo ""
echo "Step 3: Migration to be applied..."
echo ""
echo -e "${YELLOW}File: supabase/migrations/20260630000001_quote_additional_fields.sql${NC}"
cat supabase/migrations/20260630000001_quote_additional_fields.sql
echo ""

# Step 4: Confirm with user
echo ""
read -p "Do you want to apply this migration to the PRODUCTION database? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo ""
    echo -e "${YELLOW}Migration cancelled by user${NC}"
    exit 0
fi

# Step 5: Backup (optional but recommended)
echo ""
read -p "Do you want to create a backup first? (recommended, yes/no): " backup_confirm

if [ "$backup_confirm" = "yes" ]; then
    echo ""
    echo "Creating backup of quotes table..."
    BACKUP_FILE="backup-quotes-$(date +%Y%m%d-%H%M%S).sql"
    npx supabase db dump -f "$BACKUP_FILE" --data-only -t public.quotes
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
fi

# Step 6: Link to project (ensures correct connection)
echo ""
echo "Step 6: Linking to Supabase project..."
npx supabase link --project-ref "$EXPECTED_PROJECT"
echo -e "${GREEN}✓ Linked to project: $EXPECTED_PROJECT${NC}"

# Step 7: Apply migration
echo ""
echo "Step 7: Applying migration to production database..."
echo -e "${YELLOW}WARNING: This will modify the LIVE production database!${NC}"
sleep 2

npx supabase db push

echo ""
echo -e "${GREEN}✓ Migration applied successfully!${NC}"

# Step 8: Verify migration
echo ""
echo "Step 8: Verifying migration..."
echo ""

npx supabase db psql -c "
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
AND column_name IN ('adjuvant_surfactant', 'price_per_acre', 'mileage');
" 2>&1 | head -20

echo ""

npx supabase db psql -c "
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'quotes'
AND constraint_name IN ('check_price_per_acre_non_negative', 'check_mileage_non_negative');
" 2>&1 | head -20

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Migration Completed Successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify the changes in Supabase dashboard"
echo "2. Test creating/editing quotes in the UI"
echo "3. Verify PDF generation works correctly"
echo "4. Monitor application logs for any issues"
echo ""
echo "If you encounter any issues, refer to:"
echo "- MIGRATION_SAFETY_REPORT.md"
echo "- Rollback SQL in the safety report"
echo ""
