# Momentum

A premium, cross-platform productivity app built with React Native (Expo), featuring a sleek Notion-inspired design and comprehensive task management capabilities.

## Features

### Authentication & Onboarding
- Email/password authentication via Supabase
- Personalized onboarding flow with category selection
- Profile management with public/private settings

### Task Management
- Full CRUD operations for tasks
- Priority levels (low, medium, high) with visual indicators
- Task status tracking (todo, in progress, done)
- Drag-and-drop task reordering
- Due dates and recurring tasks support
- Rich task descriptions
- Subtasks with checklist functionality
- File attachments support

### Organization
- Custom life categories (Work, Personal, Family, Health, Finance, Learning, etc.)
- Color-coded category system with custom icons
- Category-based task filtering and views
- Multi-category task tagging

### Social Features
- User profiles with achievements
- Follow/follower system
- Activity feed showing completed tasks from followed users
- Public task sharing
- User discovery and search

### Analytics & Motivation
- Daily streak tracking
- Total tasks completed counter
- Today's overview dashboard
- Motivational daily quotes
- Weekly progress summaries

### Design System
- Modern, minimalist Notion-inspired UI
- Dark mode first with perfect light mode support
- Smooth animations using React Native Reanimated
- Clean monochromatic color palette (deep black, whites, soft grays)
- Soft indigo accent color (#6366F1)
- Generous whitespace and rounded corners
- Premium feel with attention to detail

## Tech Stack

- **Frontend**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **Styling**: StyleSheet API with custom theme system
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native
- **State Management**: React Context API

## Project Structure

```
momentum/
├── app/                    # File-based routing
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── tasks/             # Task management screens
│   ├── categories/        # Category management
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
├── contexts/              # React contexts (Auth, Theme)
├── lib/                   # Utilities and configuration
├── types/                 # TypeScript type definitions
├── constants/             # Colors and constants
└── assets/               # Images and static files
```

## Database Schema

The app uses Supabase with the following main tables:

- **profiles**: User information and preferences
- **tasks**: Personal tasks with full details
- **categories**: Life categories for organization
- **task_categories**: Many-to-many task-category relationships
- **subtasks**: Checklist items for tasks
- **follows**: Social follow relationships
- **teams**: Collaboration teams
- **team_tasks**: Shared team tasks
- **notifications**: User notifications

All tables include Row Level Security (RLS) policies for data protection.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm run dev
```

4. Build for web:
```bash
npm run build:web
```

## Key Features Implementation

### Real-time Updates
- Task changes sync instantly across all open sessions
- Real-time collaboration for team tasks
- Live activity feed updates

### Offline Support
- Supabase client handles offline data caching
- AsyncStorage for session persistence

### Performance
- Optimized list rendering with FlatList
- Lazy loading for large data sets
- Efficient database queries with proper indexing

### Security
- Row Level Security on all database tables
- Secure authentication with JWT tokens
- Private by default with explicit public sharing

## Future Enhancements

- Push notifications for task reminders
- Advanced analytics with charts
- Team collaboration with real-time chat
- File upload and attachment management
- Recurring task automation
- Calendar integration
- Export functionality (PDF, CSV)
- Advanced search and filters
- Widget support for iOS/Android

## License

Private - All rights reserved
