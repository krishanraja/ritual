# Design System Documentation

## Design Philosophy

**Core Principle:** Warm, intimate, and effortless. The design should feel like a gentle nudge toward connection, not a productivity app.

### Design Values
1. **Warmth over Clinical:** Soft gradients, rounded corners, friendly copy
2. **Clarity over Complexity:** One clear action at a time
3. **Delight over Efficiency:** Smooth animations, playful interactions
4. **Mobile-First Always:** Designed for thumbs, optimized for pockets

## Color System

### Core Colors (HSL)

```css
/* Primary - Warm coral/pink */
--primary: 16 90% 66%;         /* Main brand color */
--primary-foreground: 0 0% 100%;

/* Secondary - Soft peach */
--secondary: 30 80% 88%;
--secondary-foreground: 16 10% 20%;

/* Accent - Vibrant coral */
--accent: 16 100% 70%;
--accent-foreground: 0 0% 100%;

/* Background - Warm white */
--background: 30 20% 98%;
--foreground: 16 10% 10%;

/* Muted - Soft neutral */
--muted: 30 10% 92%;
--muted-foreground: 16 5% 45%;

/* Card - Elevated surface */
--card: 0 0% 100%;
--card-foreground: 16 10% 10%;

/* Destructive - Error red */
--destructive: 0 84% 60%;
--destructive-foreground: 0 0% 100%;

/* Border - Subtle division */
--border: 30 10% 90%;
--input: 30 10% 90%;
--ring: 16 90% 66%;
```

### Gradient System

```css
/* Warm gradient (primary use) */
.bg-gradient-warm {
  background: linear-gradient(
    135deg,
    hsl(30 60% 96%) 0%,
    hsl(16 60% 95%) 50%,
    hsl(10 50% 94%) 100%
  );
}

/* Ritual gradient (CTAs, emphasis) */
.bg-gradient-ritual {
  background: linear-gradient(
    135deg,
    hsl(16 90% 66%) 0%,
    hsl(350 80% 70%) 100%
  );
}

/* Hover states - slightly darker */
.hover\:bg-gradient-ritual-dark {
  background: linear-gradient(
    135deg,
    hsl(16 90% 60%) 0%,
    hsl(350 80% 64%) 100%
  );
}
```

### Color Usage Guidelines

**Primary:** 
- Call-to-action buttons
- Active nav items
- Key information highlights
- Status indicators

**Secondary:**
- Secondary actions
- Backgrounds for cards
- Hover states

**Accent:**
- Attention-grabbing elements
- Celebration moments
- Important badges

**Muted:**
- Descriptive text
- Placeholders
- Disabled states

## Typography

### Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Rationale:** System fonts for performance and native feel.

### Type Scale

```css
/* Headings */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }    /* 36px */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }  /* 30px */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }       /* 24px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }    /* 20px */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }   /* 18px */

/* Body */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* 16px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }   /* 14px */
.text-xs { font-size: 0.75rem; line-height: 1rem; }       /* 12px */
```

### Font Weights

- **font-bold (700):** Page titles, section headers
- **font-semibold (600):** Subheadings, emphasis
- **font-medium (500):** Button text, labels
- **font-normal (400):** Body text

### Typography Patterns

**Page Title:**
```tsx
<h1 className="text-2xl font-bold">This Week</h1>
```

**Card Title:**
```tsx
<h2 className="text-xl font-bold mb-2">Ritual Title</h2>
```

**Body Text:**
```tsx
<p className="text-sm text-muted-foreground leading-relaxed">
  Description text
</p>
```

**Micro Copy:**
```tsx
<span className="text-xs text-muted-foreground">Helper text</span>
```

## Spacing System

### Base Unit: 4px (0.25rem)

```css
/* Spacing scale */
.space-1 { gap: 0.25rem; }   /* 4px */
.space-2 { gap: 0.5rem; }    /* 8px */
.space-3 { gap: 0.75rem; }   /* 12px */
.space-4 { gap: 1rem; }      /* 16px */
.space-6 { gap: 1.5rem; }    /* 24px */
.space-8 { gap: 2rem; }      /* 32px */
.space-12 { gap: 3rem; }     /* 48px */
```

### Spacing Patterns

**Component Padding:**
- Small components: `p-3` (12px)
- Medium components: `p-4` (16px)
- Large components: `p-6` (24px)

**Section Spacing:**
- Between sections: `space-y-6` (24px)
- Within sections: `space-y-3` (12px)

**Page Padding:**
- Horizontal: `px-4` (16px)
- Top: `pt-4` (16px)
- Bottom: `pb-4` + `pb-safe` for mobile

## Component Library

### Button Variants

```tsx
// Primary CTA
<Button className="w-full bg-gradient-ritual text-white h-12 rounded-xl">
  Start Input
</Button>

// Secondary action
<Button variant="outline" className="w-full h-12 rounded-xl">
  Cancel
</Button>

// Destructive action
<Button variant="destructive" className="h-12 rounded-xl">
  Delete
</Button>

// Ghost (minimal)
<Button variant="ghost" size="sm">
  Skip
</Button>
```

### Card Patterns

```tsx
// Default card
<Card className="p-6 bg-card/90 backdrop-blur-sm">
  <CardContent>...</CardContent>
</Card>

// Emphasis card
<Card className="p-6 bg-gradient-ritual text-white border-0">
  <CardContent>...</CardContent>
</Card>

// Interactive card
<Card className="p-6 cursor-pointer hover:shadow-lg transition-all active:scale-95">
  <CardContent>...</CardContent>
</Card>
```

### Input Fields

```tsx
<Input
  type="text"
  placeholder="Enter text..."
  className="h-12 rounded-xl border-2 border-border focus:border-primary"
/>
```

### Badges

```tsx
// Status badge
<Badge variant="default" className="bg-primary">Active</Badge>

// Secondary badge
<Badge variant="secondary">Pending</Badge>

// Outline badge
<Badge variant="outline">Draft</Badge>
```

## Animation System

### Transition Timing

```css
/* Standard easing */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Durations */
.transition-fast { transition-duration: 150ms; }
.transition { transition-duration: 200ms; }
.transition-slow { transition-duration: 300ms; }
```

### Framer Motion Patterns

**Page Entry:**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

**Slide Down:**
```tsx
<motion.div
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
>
  {content}
</motion.div>
```

**Stagger Children:**
```tsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {children}
</motion.div>
```

## Iconography

### Icon Library: Lucide React

**Size Guidelines:**
- Default: `w-5 h-5` (20px)
- Small: `w-4 h-4` (16px)
- Large: `w-6 h-6` (24px)
- Hero: `w-8 h-8` or larger (32px+)

**Common Icons:**
- Heart: Primary ritual icon
- Calendar: Date selection
- Clock: Time selection
- Sparkles: AI/magic moments
- Check: Completion
- X: Close/dismiss
- Share2: Sharing actions
- User: Profile

### Icon + Text Pattern

```tsx
<div className="flex items-center gap-2">
  <Heart className="w-5 h-5 text-primary" />
  <span className="text-sm font-medium">This Week's Ritual</span>
</div>
```

## Layout Patterns

### Mobile-First Container

```tsx
<StrictMobileViewport>
  <div className="h-full bg-gradient-warm flex flex-col">
    {/* Content */}
  </div>
</StrictMobileViewport>
```

### Centered Content

```tsx
<div className="h-full flex flex-col justify-center items-center px-4">
  <div className="max-w-sm mx-auto w-full space-y-6">
    {/* Centered content */}
  </div>
</div>
```

### Flex Layout

```tsx
<div className="flex flex-col h-full">
  <header className="flex-none">Header</header>
  <main className="flex-1 overflow-auto">Content</main>
  <footer className="flex-none">Footer</footer>
</div>
```

## Responsive Breakpoints

```css
/* Mobile first (default) */
/* Styles apply to all sizes unless overridden */

/* sm: 640px */
@media (min-width: 640px) { ... }

/* md: 768px */
@media (min-width: 768px) { ... }

/* lg: 1024px */
@media (min-width: 1024px) { ... }
```

**Note:** App is primarily mobile. Desktop views are stretch goals.

## Dark Mode

Currently not implemented. Future consideration.

## Accessibility

### Focus States
All interactive elements have visible focus rings using `focus:ring-2 focus:ring-ring`.

### Touch Targets
Minimum 44x44px for all clickable elements.

### Color Contrast
All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

### Motion Preferences
Respect `prefers-reduced-motion` media query (TODO: implement).

## Brand Assets

### Logo
- File: `/public/favicon.png`
- Usage: Header, Loading states
- Component: `<RitualLogo />`

### Favicon
- File: `/public/favicon.png`
- Formats: PNG (primary), ICO (fallback)

## Design Tokens in Code

All design tokens are defined in:
- `src/index.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind theme extension

**Critical Rule:** Never hardcode colors. Always use semantic tokens.

```tsx
// ❌ DON'T
<div className="text-[#FF6B6B]">

// ✅ DO
<div className="text-primary">
```

## Future Design Improvements

1. Add subtle textures to backgrounds
2. Implement glassmorphism effects
3. Add micro-interactions (button ripples, etc.)
4. Create illustration library
5. Design empty states with illustrations
6. Add skeleton loading animations
7. Create confetti/celebration animations for milestones
