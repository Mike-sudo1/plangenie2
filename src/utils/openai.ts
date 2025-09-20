import Constants from 'expo-constants';

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const OPENAI_API_KEY =
  (Constants.expoConfig?.extra?.OPENAI_API_KEY as string | undefined) ??
  'sk-dmWgR...';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export const generateItinerary = async (city: string, date: string) => {
  const trimmedCity = city.trim();
  const trimmedDate = date.trim();

  if (!trimmedCity || !trimmedDate) {
    throw new Error('City and date are required to generate an itinerary.');
  }

  const openaiPrompt = `You are PlanGenie, a smart trip planner. Suggest a full-day itinerary for a tourist in ${trimmedCity}, for ${trimmedDate}. Use local time zone. Include top-rated restaurants, sightseeing spots, and cultural activities.`;

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are PlanGenie, an upbeat travel assistant that designs balanced daily itineraries with meals, cultural highlights, and relaxing breaks.',
        },
        {
          role: 'user',
          content: openaiPrompt,
        },
      ],
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Failed to generate itinerary.');
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Received an empty response from OpenAI.');
  }

  return content;
};

export const parseActivities = (raw: string) => {
  const lines = raw
    .split(/\r?\n/) // split lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const activities = lines
    .map((line) => line.replace(/^[-*\d\.\)\s]+/, '').trim())
    .filter((line) => line.length > 0);

  return activities.length > 0 ? activities : [raw.trim()];
};
