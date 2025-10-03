# 🔧 CORS Configuration Fix

## Issue Identified

The Mapa page was experiencing "Failed to fetch" errors when calling edge functions due to CORS origin validation rejecting the Lovable preview URL.

## Root Cause

- Edge functions in `supabase/functions/_shared/cors.ts` were using strict origin validation
- The current preview URL `https://c19fd3c7-1955-4ba3-bf12-37fcb264235a.lovableproject.com` was not in the allowed origins list
- Requests were being blocked at the CORS preflight stage with 403 errors

## Solution Applied

Updated `supabase/functions/_shared/cors.ts` to:

1. **Automatically allow Lovable preview URLs**: Added logic to allow any origin containing `.lovableproject.com`
2. **Allow localhost for development**: Added logic to allow localhost origins for local development
3. **Enhanced error logging**: Added better error messages to help debug CORS issues in the future

## Files Modified

- `supabase/functions/_shared/cors.ts` - Updated `isAllowed()` and `handlePreflight()` functions

## Impact

- ✅ Mapa page now loads data successfully from edge functions
- ✅ CORS errors resolved for both preview and development environments
- ✅ Maintained security by still validating origins, just with smart defaults for Lovable environments
- ✅ Better debugging with enhanced error messages

## Security Note

This change maintains security while providing flexibility for Lovable's dynamic preview URLs. The origin validation still works for production environments when `ALLOWED_ORIGINS` environment variable is properly configured.

---

_Fix applied: 2025-09-15_
