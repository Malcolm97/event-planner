# PNG Events - Event Discovery Platform

A modern, offline-first web application for discovering and managing events in Papua New Guinea. Built with Next.js, Supabase, and Progressive Web App (PWA) capabilities.

## Features

- 🎯 **Event Discovery**: Browse events by category, location, and date
- 📱 **PWA Support**: Install as a mobile app with offline functionality
- 🔄 **Offline-First**: Works seamlessly without internet connection
- 👤 **User Authentication**: Secure sign-up and login with Supabase
- 📅 **Event Management**: Create, edit, and manage your events
- 🖼️ **Image Support**: Upload multiple images per event
- 🌐 **Responsive Design**: Optimized for all device sizes
- 🔍 **Advanced Search**: Filter by location, category, and date
- 📊 **Real-time Sync**: Automatic data synchronization when online

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd png-events
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

1. Create a new Supabase project
2. Run the SQL migration files in your Supabase SQL editor:
   - `database-migration.sql` - Main database schema
   - `supabase-rls-setup.sql` - Row Level Security setup

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # Reusable React components
├── context/               # React context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

## Key Technologies

- **Next.js 14**: React framework with App Router
- **Supabase**: Backend-as-a-Service for database and authentication
- **Tailwind CSS**: Utility-first CSS framework
- **IndexedDB**: Client-side database for offline functionality
- **Service Worker**: PWA capabilities and caching
- **TypeScript**: Type-safe JavaScript

## Features Overview

### Event Management
- Create events with multiple images
- Set presale and gate prices
- Categorize events (Music, Art, Food, Technology, etc.)
- Specify venue and location details

### User System
- Email/password authentication
- User profiles with company and contact information
- Event ownership and management

### Offline Functionality
- Browse cached events when offline
- Automatic sync when connection is restored
- Service worker for asset caching
- IndexedDB for local data storage

### PWA Features
- Installable on mobile devices
- Offline page fallback
- App-like experience
- Push notification ready (future feature)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project includes:
- TypeScript for type safety
- ESLint for code linting
- Error boundaries for graceful error handling
- Input validation and sanitization
- Comprehensive error logging

## Deployment

The app is optimized for deployment on:
- Vercel (recommended for Next.js)
- Netlify
- Any platform supporting Node.js

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

## Roadmap

- [ ] Push notifications
- [ ] Event ticketing integration
- [ ] Social sharing enhancements
- [ ] Event reviews and ratings
- [ ] Calendar integration
- [ ] Advanced analytics

---

**PNG Events** - Connecting communities through events in Papua New Guinea.


Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
