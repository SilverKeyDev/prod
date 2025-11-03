# Google Calendar Feature Implementation Plan

## Overview
Implement a full-featured Google Calendar component for the dashboard, integrating with existing Google OAuth infrastructure and following established patterns.

## Architecture Analysis

### Existing Infrastructure ✅
- **Backend**: `/api/v1/google/*` routes in `Server/app/routes/google_calendar.py`
- **API Client**: `Client/packages/config/api/googleCalendar.ts`
- **Service**: `Client/packages/services/googleCalendar.ts`
- **Hooks**: `Client/packages/hooks/data/useGoogleCalendar.ts`
- **Store**: `Client/packages/store/googleCalendar.slice.ts`
- **Store Integration**: `Client/packages/hooks/store/useGoogleCalendarStoreIntegration.ts`
- **Types**: Defined in API client (`GoogleCalendar`, `GoogleEvent`, etc.)

### Feature Structure Pattern
Following `Client/apps/web/features/*` pattern:
- Feature folder: `features/dashboard/calendar/`
- Subcomponents in `components/` subfolder
- Main component exports via `index.ts`

### Styling Patterns from DashboardPage
- Uses `mx-4` for horizontal margins
- Uses `my-8` for vertical spacing
- Cards use `border border-beige/30`, `rounded-lg`, `bg-white`, `shadow-sm`
- Colors: `brown`, `beige`, `olive` from Tailwind config
- Full-width containers: `w-full`

## Implementation Steps

### Phase 1: Component Structure ✅
1. Create feature folder: `Client/apps/web/features/dashboard/calendar/`
2. Create subcomponents folder: `Client/apps/web/features/dashboard/calendar/components/`
3. Create `index.ts` for exports

### Phase 2: Calendar Component Implementation
1. **Main Calendar Component** (`Calendar.tsx`)
   - Full-width container matching DashboardPage
   - Uses `useGoogleCalendarStoreIntegration` hook
   - Handles OAuth connection state
   - Displays calendar view or connection prompt

2. **Calendar View Component** (`CalendarView.tsx`)
   - Monthly/weekly calendar grid
   - Event rendering
   - Date navigation (prev/next month)
   - Uses existing colors and styling

3. **Connection Prompt Component** (`CalendarConnectionPrompt.tsx`)
   - Shows when not connected
   - "Connect Google Calendar" button
   - Uses existing Button component styles
   - Matches DashboardPage aesthetics

4. **Event List Component** (`EventList.tsx`)
   - Shows upcoming events
   - Event details (time, title, description)
   - Loading and error states

5. **Calendar Header Component** (`CalendarHeader.tsx`)
   - Month/year display
   - Navigation buttons (prev/next)
   - Today button
   - Connection status indicator

### Phase 3: Integration
1. Update `DashboardPage.tsx` to include Calendar component
2. Add route to `RouteConfig.tsx` if needed (may not be needed if embedded)
3. Test OAuth flow
4. Test event fetching and display

### Phase 4: Styling & Polish
1. Match DashboardPage spacing and colors
2. Responsive design (mobile/desktop)
3. Loading states
4. Error handling with toasts

## File Structure

```
Client/apps/web/features/dashboard/calendar/
├── index.ts
├── Calendar.tsx                    # Main component
├── components/
│   ├── CalendarView.tsx           # Calendar grid view
│   ├── CalendarConnectionPrompt.tsx # OAuth connection UI
│   ├── EventList.tsx              # Upcoming events list
│   ├── CalendarHeader.tsx         # Header with navigation
│   └── EventCard.tsx              # Individual event card
```

## Dependencies to Use

### Hooks
- `useGoogleCalendarStoreIntegration` - Calendar data and OAuth state
- `useUIStore` - Toast notifications

### Components
- `Card` from `components/layout/Card.tsx` - Event cards
- `Button` from `components/ui/button/Button.tsx` - Actions
- Existing UI components matching DashboardPage

### API
- Already available via `useGoogleCalendarStoreIntegration`

## Calendar UI Approach

### Option A: Simple Calendar Grid (Recommended for MVP)
- Build custom calendar grid using HTML/CSS
- Display events in day cells
- Month navigation
- Matches existing design system

### Option B: Use Library
- Consider `react-big-calendar` or `@fullcalendar/react`
- However, custom solution better matches existing aesthetics

**Decision**: Build custom calendar grid for full control over styling and to match DashboardPage exactly.

## Implementation Details

### Calendar State Management
- Current month/year in component state
- Selected date (optional, for future expansion)
- View mode (month/week - start with month)

### Event Display
- Events fetched via `useGoogleCalendarStoreIntegration`
- Filter by current month
- Display in calendar cells
- Show time, title, truncated description

### Connection Flow
- Check `isConnected` from hook
- Show connection prompt if not connected
- Button triggers `connectGoogleCalendar()` from hook
- After OAuth, redirect back to `/dashboard?google=connected`
- Hook handles connection status update

### Styling Guidelines
- Container: `w-full mx-4 my-8`
- Cards: `bg-white border border-beige/30 rounded-lg shadow-sm`
- Text: Match DashboardPage text sizes
- Colors: Use `brown`, `beige`, `olive` from Tailwind
- Spacing: Follow `my-8` pattern for sections

## Testing Checklist
- [ ] Calendar displays when connected
- [ ] Connection prompt shows when not connected
- [ ] OAuth flow works (redirect to Google → callback → back to dashboard)
- [ ] Events load and display in calendar
- [ ] Month navigation works
- [ ] Responsive on mobile
- [ ] Loading states show appropriately
- [ ] Error states handled with toasts
- [ ] Styling matches DashboardPage

## Next Steps
1. Create plan document ✅
2. Implement calendar components ✅
3. Integrate into DashboardPage ✅
4. Test and polish ✅

## Implementation Status: COMPLETE ✅

### Completed Components:
1. ✅ **CalendarConnectionPrompt** - OAuth connection UI
2. ✅ **CalendarHeader** - Month/year navigation with connection status
3. ✅ **CalendarView** - Full month grid with event display
4. ✅ **EventCard** - Individual event display component
5. ✅ **EventList** - List of upcoming events
6. ✅ **Calendar** - Main component integrating all subcomponents
7. ✅ **Integration** - Added to DashboardPage with proper styling

### Features Implemented:
- ✅ Google OAuth connection flow
- ✅ Calendar month view with navigation
- ✅ Event display in calendar grid
- ✅ Upcoming events list (next 7 days)
- ✅ Loading and error states
- ✅ Toast notifications for errors/success
- ✅ Responsive design matching DashboardPage
- ✅ Full-width layout as requested

### File Structure Created:
```
Client/apps/web/features/dashboard/calendar/
├── index.ts
├── Calendar.tsx
└── components/
    ├── CalendarConnectionPrompt.tsx
    ├── CalendarHeader.tsx
    ├── CalendarView.tsx
    ├── EventCard.tsx
    └── EventList.tsx
```

### Integration:
- Calendar component added to DashboardPage above "Favorite Homes" section
- Uses existing `useGoogleCalendarStoreIntegration` hook
- Matches DashboardPage styling (colors, spacing, cards)
- Full-width container as requested

### Notes:
- All linting errors fixed
- Type imports corrected
- Follows existing codebase patterns
- Uses existing UI components (Button, Card)
- Matches DashboardPage aesthetics

