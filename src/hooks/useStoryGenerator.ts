import { useState } from 'react';
import { Location } from '../types';

const TIMEOUT_MS = 30000;

export function useStoryGenerator() {
  const [stories, setStories] = useState<Record<string, string>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  async function generateStory(location: Location, lens: string) {
    const id = location.id;
    if (stories[id] || loadingIds.has(id)) return;

    setLoadingIds((prev) => new Set(prev).add(id));
    setErrorIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setErrorMessages((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const placeName = [location.name, location.city, location.country]
      .filter(Boolean)
      .join(', ');

    const photoCount = location.photos.length;
    const tags = [...new Set(location.photos.flatMap((p) => p.tags))].slice(0, 10).join(', ');
    const visitDate = location.startTime
      ? location.startTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'recently';

    const prompt = `You are a master travel storyteller with a gift for capturing atmosphere and emotion.
Tell the story of visiting ${placeName} in ${visitDate}, through the eyes of a traveler deeply passionate about ${lens}.

The traveler took ${photoCount} photos here, and the visual themes captured include: ${tags || 'the local scenery'}.

Write 3-4 rich paragraphs that:
- Open with a vivid, sensory scene that places the reader there immediately
- Weave in the specific lens of "${lens}" naturally — what details a ${lens} lover would notice that others might miss
- Capture the atmosphere, the hidden details, and the human stories connected to this place
- End with a moment of reflection or discovery

Do not use headers or bullet points. Write in flowing, evocative prose. Do not make it a dry factual summary. Make the reader feel they are there.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch('/.netlify/functions/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await res.text();
      console.log("[useStoryGenerator] Raw response status:", res.status, "body length:", rawText.length);

      let data: { story?: string; text?: string; error?: string } = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error("[useStoryGenerator] Non-JSON response body:", rawText.slice(0, 300));
        throw new Error(`Server returned invalid response (HTTP ${res.status}): ${rawText.slice(0, 200) || "(empty body)"}`);
      }

      if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const story = data.story || data.text || '';

      if (!story) throw new Error('Gemini returned an empty response');

      setStories((prev) => ({ ...prev, [id]: story }));
    } catch (err) {
      clearTimeout(timeoutId);
      const message = err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out after 30 seconds'
        : err instanceof Error ? err.message : String(err);
      console.error('Story generation failed:', message);
      setErrorIds((prev) => new Set(prev).add(id));
      setErrorMessages((prev) => ({ ...prev, [id]: message }));
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function clearStory(locationId: string) {
    setStories((prev) => {
      const next = { ...prev };
      delete next[locationId];
      return next;
    });
    setErrorIds((prev) => {
      const next = new Set(prev);
      next.delete(locationId);
      return next;
    });
    setErrorMessages((prev) => {
      const next = { ...prev };
      delete next[locationId];
      return next;
    });
  }

  return { stories, loadingIds, errorIds, errorMessages, generateStory, clearStory };
}
