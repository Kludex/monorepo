const CHANNEL_ID = "UC91TdNbobUqT3d2CHcTkx8A";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export type Video = {
  title: string;
  videoId: string;
};

export async function fetchVideos(): Promise<Video[]> {
  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) return [];
    const xml = await response.text();
    const entries = [...xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)];
    return entries.map(([entry]) => ({
      videoId: entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? "",
      title: entry.match(/<title>(.*?)<\/title>/)?.[1] ?? "",
    }));
  } catch {
    console.warn("youtube feed unavailable, skipping video grid");
    return [];
  }
}
