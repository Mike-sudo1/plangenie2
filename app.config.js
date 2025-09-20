import 'dotenv/config';

export default {
  expo: {
    name: 'PlanGenie',
    slug: 'plangenie2',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
      MAPS_API_KEY: process.env.MAPS_API_KEY,
    },
  },
};
