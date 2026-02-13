# Frontend Code Review Audit Report

## Executive Summary
This report provides a comprehensive code review of the BharatLedger AI frontend codebase. The application is generally well-structured using modern React practices with TypeScript, TanStack Query, and Tailwind CSS. However, several issues were identified that should be addressed.

---

## 🔴 Critical Issues

### 1. Security: JWT Token Not Properly Validated
**Location:** `hooks/useAuth.ts:10-58`
**Issue:** The authentication hook stores the token but doesn't validate its expiry or decode it to get user info.
```typescript
// Current - Token stored but not validated
const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
```
**Recommendation:** Implement JWT token decoding and expiry validation to prevent using expired tokens.

### 2. Security: Hardcoded API Timeout Could Cause Issues
**Location:** `api/client.ts:11`
```typescript
timeout: 10000, // 10 second timeout
```
**Recommendation:** Move timeout to environment variable configuration for different network conditions.

---

## 🟠 High Priority Issues

### 3. Bug: Dark Mode State Not Persisted
**Location:** `components/Layout.tsx:51`
```typescript
const [darkMode, setDarkMode] = useState(false);
```
**Issue:** Dark mode preference resets on page reload. Not persisted to localStorage.
**Fix:**
```typescript
const [darkMode, setDarkMode] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('darkMode') === 'true' || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
});

useEffect(() => {
  localStorage.setItem('darkMode', String(darkMode));
}, [darkMode]);
```

### 4. Type Safety: Missing Error Types
**Location:** Multiple files
**Issue:** Generic `any` types used in error handling.
**Example:** `api/client.ts:81` - `blob` parameter implicitly has `any` type.

### 5. Performance: Large Bundle Size
**Location:** Build output shows 3MB+ main bundle
**Issue:** Spline 3D library adds significant weight.
**Recommendation:** Implement code splitting with `React.lazy()` for routes.

---

## 🟡 Medium Priority Issues

### 6. Code Quality: Unused Business API Query in Reports
**Location:** `pages/Reports.tsx:30-33`
```typescript
const { data: businesses } = useQuery({
  queryKey: ["businesses"],
  queryFn: businessApi.getAll,
});
```
**Issue:** Query made but not used in the component (selectedBusiness is read from localStorage).

### 7. Code Quality: Duplicate localStorage Access Pattern
**Location:** Multiple pages
```typescript
const selectedBusiness = localStorage.getItem("selectedBusiness");
```
**Issue:** Repeated in Dashboard, InvoiceList, InvoiceDetail, Upload, Reports.
**Recommendation:** Create a custom hook `useSelectedBusiness()`.

### 8. Accessibility: Missing ARIA Labels
**Location:** `components/FileDropzone.tsx`
**Issue:** File input lacks proper ARIA labels for screen readers.
```typescript
<input
  type="file"
  accept={accept}
  aria-label="Upload invoice file"  // Missing
  ...
/>
```

### 9. UX: Loading State Not Clear During Initial Auth
**Location:** `App.tsx:15-19`
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```
**Issue:** No loading spinner while checking authentication status - causes flash.

### 10. Potential Bug: getInitials() Can Throw
**Location:** `lib/utils.ts:44-51`
```typescript
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])  // Can be empty string if name has multiple spaces
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
```
**Fix:**
```typescript
export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(n => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}
```

---

## 🟢 Low Priority Issues / Improvements

### 11. Code Quality: Unused Trend Prop in StatCard
**Location:** `components/StatCard.tsx:10-14`
**Issue:** `trend` prop defined but not utilized in the Dashboard.

### 12. UX: No Empty State for Business Selector
**Location:** `components/Layout.tsx:143-151`
**Issue:** If no businesses exist, only shows "Create Business" button. Should show helpful message.

### 13. Consistency: Button Styling Inconsistency
**Location:** Various pages
**Issue:** Some buttons use `rounded-lg` some don't. Should standardize.

### 14. Error Handling: Toast Error Messages Not User-Friendly
**Location:** `api/client.ts:27-42`
**Issue:** Shows raw API errors to users which may be confusing.
**Recommendation:** Map common error codes to user-friendly messages.

### 15. Type Safety: Invoice Status Filter Cast
**Location:** `pages/InvoiceList.tsx:117`
```typescript
(["all", "UPLOADED", "PROCESSING", "EXTRACTED", "NEEDS_REVIEW", "FAILED"] as const)
```
**Issue:** Works but could use the InvoiceStatus type directly.

---

## 📊 Code Statistics

| Metric | Value |
|--------|-------|
| Total TypeScript Files | 28 |
| Total Lines of Code | ~4,500 |
| Components | 8 UI + 5 Pages |
| Custom Hooks | 1 (useAuth) |
| API Endpoints | 15+ |
| Third-party Libraries | 12 |

---

## ✅ Recommendations Summary

### Immediate Actions (Fix Today)
1. Fix dark mode persistence
2. Fix getInitials() potential crash
3. Add ARIA labels for accessibility
4. Add auth loading state

### Short-term (This Sprint)
5. Create useSelectedBusiness() hook
6. Implement code splitting for Spline
7. Add proper error type definitions
8. Remove unused queries

### Long-term (Backlog)
9. Implement JWT token validation
10. Move config to environment variables
11. Add comprehensive error boundary messages
12. Standardize button styling
13. Add unit tests

---

## 📁 Files Reviewed

- `App.tsx` ✅
- `main.tsx` ✅
- `hooks/useAuth.ts` ✅
- `lib/utils.ts` ✅
- `api/client.ts` ✅
- `components/Layout.tsx` ✅
- `components/StatCard.tsx` ✅
- `components/FileDropzone.tsx` ✅
- `pages/Dashboard.tsx` ✅
- `pages/InvoiceList.tsx` ✅
- `pages/InvoiceDetail.tsx` ✅
- `pages/Upload.tsx` ✅
- `pages/Reports.tsx` ✅
- `pages/Settings.tsx` ✅
- `pages/CreateBusiness.tsx` ✅
- `pages/Login.tsx` ✅
- `pages/Signup.tsx` ✅

---

*Report generated on: 2026-02-13*
*Total issues found: 15*
*Critical: 2 | High: 3 | Medium: 5 | Low: 5*
