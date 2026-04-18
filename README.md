# Quiz Platform Frontend

A modern, responsive React-based frontend for the Quiz Platform, built with Vite, Tailwind CSS, and Socket.io.

## Features

- **Teacher Dashboard**: Comprehensive specialized views for quiz creation, editing, and real-time analytics.
- **Student Dashboard**: Live quiz sessions, historical records, and personalized results.
- **Real-time Engine**: Integrated with Socket.io for synchronous, interactive quiz taking.
- **Rich Interaction**: Support for Multiple Choice, True/False, and Fill-in-the-Blanks.
- **Responsive Design**: Built with Lucide Icons and Tailwind CSS for mobile-first accessibility.
- **State Architecture**: Optimized state management using Zustand.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: Zustand
- **Routing**: React Router 7
- **Networking**: Fetch API, Socket.io-client
- **Validation**: Zod
- **Testing**: Vitest, React Testing Library

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Backend**: Ensure the [Quiz Backend](../quiz-platform-backend) is running

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` or `.env.local` file in the `quiz-platform-frontend` directory:

```env
VITE_API_URL="http://localhost:3000"
VITE_SOCKET_URL="http://localhost:3000"
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Available Scripts

- `npm run dev`: Starts the development server with Hot Module Replacement (HMR).
- `npm run build`: Compiles and optimizes for production deployment.
- `npm run lint`: Checks for React-specific formatting and logic errors.
- `npm run preview`: Launches a local server for production-ready builds.
- `npm run test`: Runs all unit and component-level tests.
- `npm run test:watch`: Runs tests in watch mode for active development.

## Project Structure

- `src/components`: Reusable UI elements, layout components, and quiz-specific logic.
- `src/pages`: Feature-rich views for both Students and Teachers.
- `src/stores`: Zustand global state management for Auth, Quizzes, and Sockets.
- `src/lib`: Core utility functions, API services, and Socket.io configuration.
- `src/hooks`: Custom React hooks for shared logic.
- `tests/`: Comprehensive test suite for components, pages, and utilities.
