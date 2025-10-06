# 🔄 Routing Migration Guide - `/app/*` Structure

## 📋 Overview

This migration introduces a clear separation between public and protected routes:
- **Public routes**: `/`, `/sobre`, `/beta`, `/login`, `/demo/*` (no authentication)
- **Protected routes**: `/app/*` (requires authentication)

## 🔑 Key Changes

### Route Structure

| Old Path | New Path | Type |
|----------|----------|------|
| `/dashboard` | `/app/dashboard` | Protected |
| `/mapa-testemunhas` | `/app/mapa-testemunhas` | Protected |
| `/admin` | `/app/admin` | Protected |
| `/admin/*` | `/app/admin/*` | Protected |
| `/profile` | `/app/profile` | Protected |
| `/settings` | `/app/settings` | Protected |
| `/dados/mapa` | `/app/dados/mapa` | Protected |
| `/` | `/` | Public |
| `/sobre` | `/sobre` | Public |
| `/beta` | `/beta` | Public |
| `/login` | `/login` | Public |
| `/demo/*` | `/demo/*` | Public |

### New Components

1. **RouteGuard** (`src/components/routing/RouteGuard.tsx`)
   - Single authentication guard for all `/app/*` routes
   - Replaces multiple `AuthGuard` usages
   - Automatically wraps with `AppLayout`
   - Handles redirect to `/login?next={path}`

2. **DemoRoutes** (`src/routes/DemoRoutes.tsx`)
   - Public demonstration routes
   - No authentication required
   - SEO optimized

### Updated Configuration

1. **Auth Config** (`src/config/auth.ts`)
   ```typescript
   DEFAULT_REDIRECTS: {
     ADMIN: "/app/dashboard",
     ANALYST: "/app/dashboard",
     VIEWER: "/app/dashboard",
     DEFAULT: "/app/dashboard",
   }
   ```

2. **Sidebar Config** (`src/config/sidebar.ts`)
   - All navigation items now point to `/app/*` paths

3. **App Header** (`src/components/navigation/AppHeader.tsx`)
   - Breadcrumbs updated for `/app/*` paths

## 🔄 Migration Steps for Developers

### 1. Update Direct Navigation

```typescript
// ❌ Old
navigate("/dashboard");
navigate("/mapa-testemunhas");
navigate("/admin");

// ✅ New
navigate("/app/dashboard");
navigate("/app/mapa-testemunhas");
navigate("/app/admin");
```

### 2. Update Links

```tsx
// ❌ Old
<Link to="/dashboard">Dashboard</Link>
<Link to="/admin">Admin</Link>

// ✅ New
<Link to="/app/dashboard">Dashboard</Link>
<Link to="/app/admin">Admin</Link>
```

### 3. Update Redirects

```typescript
// ❌ Old
<Navigate to="/dashboard" />

// ✅ New
<Navigate to="/app/dashboard" />
```

### 4. Protected Routes

```tsx
// ❌ Old - Multiple AuthGuards
<Route 
  path="/dashboard" 
  element={
    <AuthGuard>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </AuthGuard>
  } 
/>

// ✅ New - Single RouteGuard with nested routes
<Route 
  path="/app/*" 
  element={<RouteGuard><Outlet /></RouteGuard>}
>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="mapa-testemunhas" element={<MapaPage />} />
</Route>
```

## ⚠️ Breaking Changes

### For Users
- **Bookmarked URLs**: Old bookmarks (e.g., `/dashboard`) will redirect to `/app/dashboard`
- **Shared Links**: Update any shared links to use new `/app/*` paths
- **Browser History**: Old URLs in history will redirect automatically

### For Developers
- **Hard-coded paths**: All hard-coded route paths must be updated
- **API responses**: If your backend returns redirect URLs, update them to `/app/*`
- **External integrations**: Update any external services that deep-link into the app

### For External APIs
- Update OAuth redirect URLs if they point to specific app pages
- Update email links to use `/app/*` paths
- Update webhook/callback URLs

## 🧪 Testing Checklist

- [ ] Unauthenticated user accessing `/app/*` → redirects to `/login?next=/app/...`
- [ ] Authenticated user accessing `/app/*` → shows content
- [ ] Public routes (`/`, `/sobre`, `/demo/*`) → accessible without auth
- [ ] Old URLs (`/dashboard`, `/mapa`) → redirect to `/app/*`
- [ ] Navigation links in sidebar → work correctly
- [ ] Breadcrumbs → display correct paths
- [ ] Back button → navigates correctly
- [ ] Deep links with `?next=` parameter → redirect after login
- [ ] Role-based access → redirects correctly for insufficient permissions

## 📊 Impact Analysis

### Security
- ✅ **Improved**: Single auth checkpoint at `/app/*`
- ✅ **Improved**: Clear separation of public/private routes
- ✅ **Improved**: Harder to accidentally expose protected routes

### SEO
- ✅ **Improved**: Public landing pages not mixed with app routes
- ✅ **Improved**: Clean URL structure for public content
- ✅ **Improved**: Better crawlability for marketing pages

### Maintenance
- ✅ **Improved**: Single `RouteGuard` instead of multiple `AuthGuard`s
- ✅ **Improved**: Clear pattern for adding new routes
- ✅ **Improved**: Easier to reason about auth flow

### Performance
- ➡️ **Neutral**: No significant performance impact
- ✅ **Improved**: Lazy loading of demo routes

## 🔗 Related Files

- `src/components/routing/RouteGuard.tsx` - New auth guard
- `src/routes/DemoRoutes.tsx` - Public demo routes
- `src/App.tsx` - Main routing configuration
- `src/config/auth.ts` - Auth configuration
- `src/config/sidebar.ts` - Sidebar navigation
- `src/components/navigation/AppHeader.tsx` - Breadcrumbs
- `src/components/navigation/AppSidebar.tsx` - Navigation menu

## 📞 Support

If you encounter issues with the migration:
1. Check this guide first
2. Verify your URLs match the new `/app/*` pattern
3. Clear browser cache and localStorage
4. Check console for routing errors
5. Contact the development team

---

**Migration Date**: 2025-01-XX  
**Version**: 2.0.0  
**Breaking**: Yes ⚠️
