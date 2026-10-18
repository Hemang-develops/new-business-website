export async function lookupCountry(apiKey, ip) {
  const url = new URL("https://api.geoapify.com/v1/ipinfo");
  url.searchParams.set("apiKey", apiKey);
  if (ip) url.searchParams.set("ip", ip);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geoapify returned ${response.status}`);
  const data = await response.json();
  const countryCode = String(data?.country?.iso_code || data?.country?.isoCode || data?.country_code || "").toUpperCase();
  const countryName = data?.country?.names?.en || data?.country?.name || data?.country_name || "";
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error("Geoapify response did not include a country code");
  return { countryCode, countryName };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return response.status(503).json({ error: "Country lookup is unavailable" });

  const forwardedFor = request.headers["x-forwarded-for"];
  const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "";
  try {
    const country = await lookupCountry(apiKey, ip);
    response.setHeader("Cache-Control", "private, max-age=86400");
    return response.status(200).json(country);
  } catch {
    return response.status(502).json({ error: "Country lookup failed" });
  }
}
