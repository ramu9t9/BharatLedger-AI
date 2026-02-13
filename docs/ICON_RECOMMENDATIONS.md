# Icon Library Recommendations for BharatLedger AI

## Overview
This document recommends icons from **Lordicon** and **Iconsax** that would enhance the BharatLedger AI GST & Invoice Management application.

## Current Icons in Use (Lucide React)
- FileText, Search, Filter, Plus, Trash2
- Upload, Download, Loader2, CheckCircle2, AlertCircle
- User, LogOut, Building2, Bell, Moon, Sun
- BarChart3, TrendingUp, TrendingDown
- ArrowLeft, RefreshCw, Save, Pencil, X, Check
- Eye, EyeOff, AlertTriangle, ChevronDown
- Package, Receipt, Copy

---

## Recommended Icons by Category

### 1. Authentication & User
| Purpose | Lordicon | Iconsax | Notes |
|---------|----------|---------|-------|
| Login | login, enter | login, arrow-left | Auth pages |
| Logout | logout, exit-logout | logout, arrow-right-1 | Header dropdown |
| Profile | user, profile | profile-circle, user | Settings |
| Password | lock, unlock, key | lock, unlock, key | Login forms |

### 2. Invoice & Documents
| Purpose | Lordicon | Iconsax | Notes |
|---------|----------|---------|-------|
| Invoice | receipt, bill, invoice | document-text, receipt | Invoice list |
| Upload | cloud-upload, upload | cloud-upload, arrow-up | Upload page |
| Download | download, save, export | arrow-down, save-2 | Reports, Export |
| View | eye, view, preview | eye, visibility | Invoice detail |
| Edit | edit, pencil, pen | edit-2, edit | Line items |
| Delete | trash, delete, bin | trash-2, delete | Invoice actions |

### 3. GST & Finance
| Purpose | Lordicon | Iconsax | Notes |
|---------|----------|---------|-------|
| GST | percent-tag, discount | discount-shape, tag | Tax cards |
| Money | currency-rupee, wallet | wallet, money-tick | Financial KPIs |
| Tax | receipt-tax, calculator | calculator, data-2 | Tax summaries |
| Credit | credit-card, card | credit-card, card-tick | ITC |
| Bank | bank, building, landmark | bank, building-4 | Vendor payments |
| Transaction | swap, arrows, transfer | exchange, arrows-exchange | GST transitions |

### 4. Dashboard & Navigation
| Purpose | Lordicon | Iconsax | Notes |
|---------|----------|---------|-------|
| Dashboard | dashboard, layout-grid | grid, element-4 | Sidebar |
| Reports | chart, bar-chart, pie-chart | chart, diagram | Reports page |
| Settings | settings, cog, options | setting, setting-2 | Settings page |
| Business | briefcase, office | briefcase, bag | Business selector |
| Calendar | calendar, date, event | calendar, calendar-1 | Month selector |
| Notifications | bell, alarm, alert | notification, bell-1 | Header |

### 5. Status & Actions
| Purpose | Lordicon | Iconsax | Notes |
|---------|----------|---------|-------|
| Success | check-circle, tick-circle | tick-circle, verify | Toast notifications |
| Error | x-circle, close-circle | x-circle, close-circle | Error states |
| Warning | alert-triangle, warning | warning, warning-2 | GST alerts |
| Processing | spinner, refresh, loader | spinner, refresh | Invoice status |
| Complete | check, tick, done | tick, verify | Processing done |

### 6. Data & Tables
| Purpose | Lordicon | Iconsax | Notes |
|---------|----------|---------|-------|
| Table | list, menu, hamburger | list, menu | Invoice list |
| Filter | filter, funnel | filter, setting-4 | Filters |
| Sort | arrow-up-down, sort | arrow-up-down, sort | Table headers |
| Search | search, magnifying-glass | search-normal, search | Search input |
| Refresh | rotate-ccw, refresh | refresh, arrow-repeat | Reload data |

---

## Recommended Installations

### Option 1: Lordicon (Animated)
```bash
npm install lordicon
```
- **Pros**: Beautiful animated icons
- **Best for**: Login page, success states, CTAs
- **Usage**: 
```tsx
import Lordicon from 'lordicon-element';
// <lordicon src="url-to-icon" size="50" colors="primary:#000" />
```

### Option 2: Iconsax (Comprehensive)
```bash
npm install iconsax-react
```
- **Pros**: 2000+ icons, consistent style, multiple variants
- **Best for**: Full application iconography
- **Usage**:
```tsx
import { Home, DocumentText, Wallet } from 'iconsax-react';
// <Home variant="Bulk" />
```

---

## Icon Selection for Immediate Use

### High Priority (Replace existing Lucide icons)
1. **Invoice icons** - Use Iconsax `document-text` or Lordicon `invoice`
2. **GST/Calculator** - Use Iconsax `calculator` or `percent`
3. **Wallet/Money** - Use Iconsax `wallet` for ITC summary
4. **Rupee** - Lordicon has animated rupee

### Medium Priority (Add new functionality)
1. **Business selector** - Iconsax `building` or `briefcase`
2. **Month/Date picker** - Iconsax `calendar`
3. **Export** - Iconsax `arrow-down-2`
4. **Credit cards** - Iconsax `card-tick` for ITC

### Low Priority (Polish)
1. **Login page** - Lordicon animated icons
2. **Success states** - Lordicon check animations
3. **Loading states** - Lordicon spinner animations

---

## Summary Recommendation

For BharatLedger AI, I recommend:

1. **Install Iconsax** for core application icons (consistent, comprehensive)
2. **Use Lordicon selectively** for the login page and success animations

This combination gives you:
- Professional, consistent icons throughout the app
- Animated delight on key user interactions
- Full coverage of all use cases

The most impactful changes would be:
- Login page with Lordicon animations
- Dashboard KPI cards with Iconsax icons
- Invoice status with visual indicators
