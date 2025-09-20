# PlanGenie2

PlanGenie2 is a smart day planner built with Expo and React Native. After signing in with email and password, travellers can generate tailored daily itineraries powered by OpenAI and keep their session synced with Supabase Auth.

## Features

- **Email authentication:** Users can sign up or sign in with Supabase Auth; sessions persist automatically so returning travellers jump right back in.
- **Explore inspiration:** Browse a set of curated categories and search for destinations to spark ideas before building a plan.
- **AI-generated day plan:** Provide a city and date, tap **Generate My Day**, and PlanGenie2 requests OpenAI for 5–8 curated activities.
- **Profile settings:** View the currently signed-in email address and log out at any time.
- **Pastel UI:** Gentle colours and rounded cards make the layout Expo Go–friendly while staying easy to extend.

## Project structure

```
App.tsx
src/
  context/
    AuthContext.tsx
  navigation/
    BottomTabs.tsx
  screens/
    AuthScreen.tsx
    ExploreScreen.tsx
    PlanScreen.tsx
    SettingsScreen.tsx
  utils/
    openai.ts
    supabase.ts
```

## Prerequisites

- Node.js 18 or newer
- Expo CLI (`npm install --global expo-cli`)
- Expo Go installed on your mobile device (for live preview)

## Installation

```bash
npm install
```

## Environment variables

Create a `.env` file (or copy `.env.example`) at the project root with the following keys:

```
OPENAI_API_KEY=sk-dmWgR...
SUPABASE_URL=https://eipbppysljtcmqyjuamg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Replace the placeholder segments with your real credentials. The values also default to the sample keys provided in `app.config.js` so the layout can run without extra configuration, but production builds should always set secure environment variables.

## Running the app

Start the Expo development server and follow the QR code instructions to open the project in Expo Go:

```bash
npm start
```

Workflow overview:

1. Launch the app and sign up (or sign in) with your email and password.
2. Use the **Explore** tab to browse categories or search for keywords.
3. Switch to **Plan** and enter the city and date you want to explore, then tap **Generate My Day**.
4. Review the suggested activities and return to **Settings** to log out when you are finished.

## Testing

Type-check the project with:

```bash
npx tsc --noEmit
```

## Debugging tips

- Confirm the `.env` file is loaded or update the fallback keys in `app.config.js`.
- Ensure your device has network access so Supabase authentication and OpenAI itinerary generation succeed.
- Watch the Metro bundler logs for helpful runtime messages when developing in Expo Go.
