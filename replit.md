# Build-Smart - Construction Material Estimator

## Overview
Build-Smart is a full-stack web application for construction material estimation built with React, Express, and PostgreSQL. The application helps users estimate concrete material requirements for construction projects with intelligent calculations and project management features.

## Recent Changes (September 21, 2025)
- **Project Import Setup**: Successfully imported from GitHub and configured for Replit environment
- **Database Setup**: Created PostgreSQL database schema with tables for users, projects, estimates, sessions, and materials
- **Vite Configuration**: Updated to allow all hosts for Replit proxy compatibility (host: "0.0.0.0", port: 5000)
- **Development Workflow**: Configured to run on port 5000 with proper Express + Vite integration
- **Deployment Configuration**: Set up autoscale deployment with build and start commands

## Project Architecture
- **Frontend**: React with TypeScript, Vite build tool, Tailwind CSS for styling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration with session management
- **Build System**: Vite for frontend bundling, esbuild for backend compilation

## Key Technologies
- React 18 with TypeScript
- Express.js with TypeScript
- PostgreSQL database
- Drizzle ORM for database management
- Tailwind CSS and Radix UI components
- Vite for development and build tooling
- OpenAI integration for AI features
- Replit Auth for authentication

## Project Structure
```
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # React components including UI library
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions and configurations
│   │   └── pages/       # Application pages/routes
├── server/              # Express backend
│   ├── index.ts         # Main server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database layer
│   ├── estimator.ts     # Core estimation logic
│   └── vite.ts          # Vite development server integration
├── shared/              # Shared code between client and server
│   └── schema.ts        # Database schema and types
└── attached_assets/     # Project documentation and assets
```

## User Preferences
- Uses modern TypeScript with ES modules
- Prefers React functional components with hooks
- Uses Tailwind CSS for styling with Radix UI components
- Database operations through Drizzle ORM
- RESTful API design patterns

## Database Tables
- **sessions**: User session storage for authentication
- **users**: User accounts and profiles
- **projects**: Construction project management
- **estimates**: Material estimation records
- **materials**: Material type definitions
- **suppliers**: Supplier information (Phase 2)
- **pricing**: Material pricing data (Phase 2)

## Development Commands
- `npm run dev`: Start development server (port 5000)
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run check`: TypeScript type checking
- `npm run db:push`: Sync database schema

## Features
- Material estimation calculator with configurable mix ratios
- Project management and organization
- User authentication and authorization
- Export capabilities (CSV, JSON, PDF)
- Dashboard with statistics and recent activity
- Responsive design with modern UI components

## Environment Setup
- Configured for Replit environment with proper host settings
- PostgreSQL database with UUID extensions enabled
- Vite development server with HMR and proxy support
- Authentication integrated with Replit Auth system