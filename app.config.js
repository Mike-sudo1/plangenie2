import 'dotenv/config';

export default {
  expo: {
    name: 'PlanGenie2',
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
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? 'sk-dmWgR...',
      SUPABASE_URL: process.env.SUPABASE_URL ?? 'https://eipbppysljtcmqyjuamg.supabase.co',
      SUPABASE_ANON_KEY:
        process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },
};
