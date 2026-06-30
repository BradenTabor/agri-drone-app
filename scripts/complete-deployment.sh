#!/bin/bash
# Complete Deployment - One Command
# This script completes the entire deployment process

set -e

echo "🚀 Starting Complete Deployment Process..."
echo ""

# Check if Supabase is authenticated
if ! npx supabase projects list >/dev/null 2>&1; then
    echo "❌ Not authenticated to Supabase"
    echo ""
    echo "Please authenticate first:"
    echo "  npx supabase login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Supabase authentication verified"
echo ""

# Run the migration deployment script
echo "📦 Running migration deployment..."
./scripts/deploy-migration.sh

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Post-Deployment Checklist:"
echo "  1. Check Supabase dashboard"
echo "  2. Test quote creation in UI"
echo "  3. Test PDF generation and sharing"
echo "  4. Monitor application logs"
echo ""
echo "🎉 All done!"
