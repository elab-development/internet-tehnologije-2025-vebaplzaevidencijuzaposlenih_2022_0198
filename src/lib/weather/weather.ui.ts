export function getWeatherIcon(code: number | null | undefined): string {
  if (code == null) return "/icons/weather/cloudy.svg";

  if (code === 0) return "/icons/weather/sun.svg";
  if (code >= 1 && code <= 2) return "/icons/weather/cloud-sun.svg";
  if (code === 3) return "/icons/weather/cloudy.svg";
  if (code >= 45 && code <= 48) return "/icons/weather/cloud-fog.svg";

  if (code >= 51 && code <= 55) return "/icons/weather/cloud-drizzle.svg";
  if ((code >= 56 && code <= 67) || (code >= 80 && code <= 82))
    return "/icons/weather/cloud-rain.svg";
  if (code >= 71 && code <= 77) return "/icons/weather/cloud-snow.svg";
  if (code >= 95) return "/icons/weather/cloud-bolt.svg";

  return "/icons/weather/cloudy.svg";
}
