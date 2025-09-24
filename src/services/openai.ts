import Constants from "expo-constants";
import type { CityStay, Interest } from "../types";

export async function proposeCitiesForCountry(params: {
  country: string;
  totalNights: number;
  interests: Interest[];
  budgetPerDay?: number;
}): Promise<CityStay[]> {
  const OPENAI_API_KEY: string =
    (Constants?.expoConfig?.extra as any)?.OPENAI_API_KEY ?? "";

  const system = `You are a precise travel planner. \nReturn only valid JSON for a list of city stays in the given country. \nDistribute nights realistically, prioritize an efficient geographic route if obvious (e.g., south→north), and include lat/lng for each city center. \nMax 6 cities.`;

  const user = {
    country: params.country,
    totalNights: params.totalNights,
    interests: params.interests,
    budgetPerDay: params.budgetPerDay ?? null,
    format: {
      type: "array",
      items: {
        city: "string",
        country: "string",
        lat: "number",
        lng: "number",
        nights: "number"
      }
    }
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${t}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }

  const arr = Array.isArray(parsed) ? parsed : parsed?.data || [];
  return (arr as any[]).map((c) => ({
    city: c.city,
    country: c.country || params.country,
    lat: c.lat,
    lng: c.lng,
    nights: Math.max(1, Math.round(c.nights)),
  }));
}
