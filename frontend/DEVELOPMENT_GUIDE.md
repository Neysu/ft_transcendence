# ft_transcendence Frontend - Development Guide

## 📋 Project Overview

This is the frontend for the **ft_transcendence** project - a Next.js application built with TypeScript, Tailwind CSS, and shadcn/ui components.

---

## 🏗️ Project Structure

```
frontend/
├── app/                          # Next.js App Router (Pages & Layouts)
│   ├── layout.tsx               # Root layout with theme and language providers
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   ├── landing/
│   │   ├── page.tsx             # Main landing page
│   │   └── signin/
│   │       └── page.tsx         # Sign-in page with transparent/solid card panels
│   ├── about/
│   │   └── page.tsx             # About page (demo page)
│   ├── friends/
│   │   └── page.tsx             # Friends page
│   ├── param/
│   │   ├── page.tsx             # Settings/Parameters page
│   │   ├── change-email/
│   │   ├── change-password/
│   │   ├── change-profile-picture/
│   │   └── change-username/
│   └── extra-info/
│       └── page.tsx             # Extra information page
│
├── components/                   # Reusable UI Components (Atomic Design)
│   ├── atoms/                   # Smallest, indivisible components
│   │   ├── Button.tsx           # Primary button component
│   │   ├── ButtonCircleBack.tsx # Circular back button
│   │   ├── ButtonSubmite.tsx    # Submit button
│   │   ├── ExtraInfo.tsx        # Fixed bottom info link (translatable)
│   │   └── TextInput.tsx        # Text input field (theme-aware)
│   │
│   ├── molecules/               # Composed of atoms, more complex
│   │   ├── CardPanel.tsx        # Transparent card with theme border
│   │   └── CardPanelSolid.tsx   # Solid card (non-transparent)
│   │
│   ├── ui/                      # shadcn/ui components
│   │   ├── alert-dialog.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── combobox.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── field.tsx
│   │   ├── input-group.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   └── textarea.tsx
│   │
│   ├── LanguageProvider.tsx     # Language/i18n context provider
│   ├── LanguageToggle.tsx       # Language switcher button
│   ├── ThemeSync.tsx            # Theme synchronization wrapper
│   ├── ThemeToggle.tsx          # Theme switcher (green/purple)
│   └── Logo.tsx                 # Rock/Paper/Scissors animated logo
│
├── lib/
│   └── utils.ts                 # Utility functions
│
├── public/                      # Static assets
│
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── package.json                # Dependencies
```

---

## 🎨 Design System

### Colors & Themes

The application supports **two themes**: `green` and `purple`

- **Green Theme:**
  - Primary: `#9BFA32`
  - Background: `rgba(155, 250, 50, 0.5)`
  - Cards: `#E6FFD6`

- **Purple Theme:**
  - Primary: `#9D33FA`
  - Background: `rgba(216, 180, 254, 0.85)`
  - Cards: `#D9D9D9`

### Component Hierarchy (Atomic Design)

1. **Atoms** - Basic building blocks
   - Buttons: `Button.tsx`, `ButtonCircleBack.tsx`, `ButtonSubmite.tsx`
   - Input: `TextInput.tsx`
   - Info: `ExtraInfo.tsx`

2. **Molecules** - Composed of atoms
   - `CardPanel.tsx` - Transparent card with border
   - `CardPanelSolid.tsx` - Solid card

3. **UI Library** - shadcn/ui pre-built components

---

## 🌍 Internationalization (i18n)

### How Translations Work

The app supports **3 languages**: English (en), French (fr), Spanish (es)

**File:** `components/LanguageProvider.tsx`

```typescript
// Example usage in components:
const { t, language, toggleLanguage } = useLanguage();
return <h1>{t("welcome")}</h1>; // Returns translated text
```

### Adding New Translations

Edit the `translations` object in `LanguageProvider.tsx`:

```typescript
const translations = {
  en: {
    welcome: "Welcome to ft_transcendence",
    myNewKey: "My new translation",
  },
  fr: {
    welcome: "Bienvenue à ft_transcendence",
    myNewKey: "Ma nouvelle traduction",
  },
  es: {
    welcome: "Bienvenido a ft_transcendence",
    myNewKey: "Mi nueva traducción",
  },
};
```

---

## 🎭 Theme System

### How Themes Work

The app supports **green** and **purple** themes.

**Implementation:**
- Theme preference is stored in `localStorage`
- Applied via `data-theme` attribute on `<html>` element
- Components detect changes via `MutationObserver`

**Using Theme in Components:**

```typescript
const [theme, setTheme] = useState<string>("green");

useEffect(() => {
  if (typeof document !== "undefined") {
    setTheme(document.documentElement.getAttribute("data-theme") || "green");
  }
  const observer = new MutationObserver(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "green");
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}, []);

// Apply theme-based styles
const bgColor = theme === "purple" ? "#D9D9D9" : "#E6FFD6";
```

---

## 📱 Key Pages

### Landing Page (`app/landing/page.tsx`)
- Entry point with Sign In / Sign Up buttons
- Links to `/landing/signin` page

### Sign In Page (`app/landing/signin/page.tsx`)
- Features a transparent CardPanel with nested solid CardPanelSolid
- 5px margin between panel borders
- Fixed back button at top-left
- Ready for login form implementation

### About Page (`app/about/page.tsx`)
- Demo page showing CardPanel components
- Includes TextInput atom for testing

---

## 🔧 Creating New Components

### Atom (Simple Component)

Create in `components/atoms/YourComponent.tsx`:

```typescript
"use client";

import React from "react";

export interface YourComponentProps {
  className?: string;
  // Your props here
}

/**
 * Atom: YourComponent
 * Brief description of what this component does.
 */
export const YourComponent: React.FC<YourComponentProps> = ({ className = "" }) => {
  // Component logic
  const [theme, setTheme] = React.useState<string>("green");

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    }
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "green");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Apply theme-based logic
  const color = theme === "purple" ? "#9D33FA" : "#9BFA32";

  return <div className={className}>{/* Your JSX */}</div>;
};
```

### Molecule (Complex Component)

Create in `components/molecules/YourMolecule.tsx`:

```typescript
"use client";

import React from "react";
import { YourAtom } from "@/components/atoms/YourAtom";

export interface YourMoleculeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Molecule: YourMolecule
 * Composed of multiple atoms and more complex logic.
 */
export const YourMolecule: React.FC<YourMoleculeProps> = ({ children, className = "" }) => {
  // Molecule logic combining atoms
  return (
    <div className={className}>
      <YourAtom />
      {children}
    </div>
  );
};
```

### Creating a New Page

Create in `app/yourpage/page.tsx`:

```typescript
"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { ButtonCircleBack } from "@/components/atoms/ButtonCircleBack";

export default function YourPage() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center gap-4">
      {/* Back button (optional) */}
      <div className="fixed top-5 left-4 z-50">
        <ButtonCircleBack onClick={() => router.back()} />
      </div>

      {/* Your page content */}
      <h1>{t("yourKey")}</h1>
    </main>
  );
}
```

---

## 📚 Current Components Reference

### Atoms

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| Button | `Button.tsx` | `children`, `className`, `onClick` | Primary button |
| ButtonCircleBack | `ButtonCircleBack.tsx` | `onClick` | Circular back button |
| ButtonSubmite | `ButtonSubmite.tsx` | `onClick`, `className` | Submit button |
| TextInput | `TextInput.tsx` | `placeholder`, `value`, `onChange`, `type` | Theme-aware text input |
| ExtraInfo | `ExtraInfo.tsx` | `text`, `className` | Fixed bottom info link (translatable) |

### Molecules

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| CardPanel | `CardPanel.tsx` | `children`, `className` | Transparent card with theme border |
| CardPanelSolid | `CardPanelSolid.tsx` | `children`, `className`, `style` | Solid background card |

---

## 🚀 Common Tasks

### Add a New Translated Text

1. Edit `components/LanguageProvider.tsx`
2. Add the key to all three language objects (en, fr, es)
3. Use in component: `const { t } = useLanguage(); t("yourKey")`

### Change Theme Colors

Edit the theme detection sections in component files:

```typescript
const color = theme === "purple" ? "#9D33FA" : "#9BFA32";
```

### Add Navigation Between Pages

Use Next.js `Link` component:

```typescript
import Link from "next/link";

<Link href="/landing/signin">
  <ButtonBasic1>Sign In</ButtonBasic1>
</Link>
```

### Make a Component Theme-Aware

1. Add theme detection logic (see Atom template above)
2. Apply conditional styles based on theme
3. Component automatically responds to theme changes

---

## 🔗 Layout Structure

**Root Layout** (`app/layout.tsx`):
- Wraps all pages with `ThemeSync` and `LanguageProvider`
- Provides global theme/language functionality
- Includes fixed Header (Logo + Toggles) and Footer (ExtraInfo)

**Page height calculation:**
```
Total viewport = 100vh
Header + Footer = 160px
Content area = calc(100vh - 160px)
```

---

## 📝 Development Tips

1. **Always add "use client"** at the top of components that use hooks
2. **Use theme detection** for all visual customizations
3. **Add comments** above different sections for clarity
4. **Import from correct paths**: `@/components/...`, `@/lib/...`
5. **Keep atoms simple** - single responsibility
6. **Compose molecules** from atoms for reusability
7. **Test with both themes** before committing

---

## 🐛 Debugging

### Theme not changing?
- Check if component has proper MutationObserver setup
- Verify `useEffect` dependencies

### Translations not showing?
- Ensure key exists in all 3 language objects
- Check `LanguageProvider` is wrapping your component
- Verify you're using `"use client"` directive

### Styling not applying?
- Check Tailwind classes are valid
- Verify theme variable names match
- Test inline styles vs className separately

---

## 📖 Last Updated

**January 31, 2026**

This document will be updated as new components and features are added to the project.
