# PlanGenie

PlanGenie is a smart itinerary generator built with Expo and React Native. Enter a destination, travel dates, interests, and budget to receive a personalised, day-by-day plan complete with weather insights, Google Maps links, surprise activities, and sharing tools.

## Features

- **Guided planning flow:** Capture destinations, date ranges, budgets, and favourite interests with a card-based form.
- **AI-generated itineraries:** Calls OpenAI's Chat Completions API to craft JSON itineraries that include weather-aware activities, surprise moments, and cost estimates.
- **Weather context:** Fetches forecast data from OpenWeather and merges it into each day of the plan.
- **Maps integration:** Generates Google Maps search links for every activity location.
- **History & regeneration:** Saves recent itineraries locally for quick reloading, with options to clear or regenerate plans.
- **Budget meter:** Visualises estimated spend versus the provided budget.
- **Sharing:** Export itineraries via the native share sheet to text or email.
- **Custom settings:** Configure default budgets, preferred units, currency, and surprise mode defaults.

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
OPENAI_API_KEY=sk-xxx-your-key
OPENWEATHER_API_KEY=your-openweather-key
MAPS_API_KEY=your-google-maps-key
```

These values are surfaced to the app through [`app.config.js`](./app.config.js) and read at runtime via `expo-constants`.

> **Note:** The Google Maps key is reserved for future deep integrations. Maps links currently rely on standard search URLs.

## Running the app

Start the Expo development server and follow the QR code instructions to open the project in Expo Go:

```bash
npm start
```

The typical workflow is:

1. Open the Home screen and fill out your destination, dates, interests, and budget.
2. Tap **“✨ Generate Itinerary”** to call OpenAI and build your travel plan.
3. Review the generated itinerary on the Plan screen, share it, or start over.
4. Adjust defaults and surprise mode behaviour from the Settings screen.

## Testing

Type-check the project with:

```bash
npx tsc --noEmit
```

## Additional notes

- Recent itineraries are stored in AsyncStorage for quick recall. Clearing history wipes these local entries.
- Ensure the device running Expo Go has network access so API calls to OpenAI and OpenWeather succeed.
- The itinerary prompt expects JSON; malformed responses will surface a readable error banner so you can retry.
# PlanGenie2

PlanGenie2 is a minimal Expo + React Native layout for testing in Expo Go.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Expo development server:
   ```bash
   npm start
   ```
3. Open the project in Expo Go to preview the layout.

The app currently includes:
- A bottom tab navigator with Plan, Explore, and Profile screens.
- A shared header component displaying the "PlanGenie" title.
- Soft pastel styling for the background and tab bar.

This scaffold is ready for future feature work without any API integrations or complex logic yet.
