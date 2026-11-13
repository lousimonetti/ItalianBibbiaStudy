import { useEffect, useState } from 'react';
import { fetchImages, forgetImage, loadImageCache } from '../utils/wikiImage';

// One English-Wikipedia lead picture, by article title. Renders nothing until (and
// unless) there is a picture to show, so the layout never waits on it.
export function WikiImage({ title, alt, className = '', link = false }) {
  const [src, setSrc] = useState(() => (title ? loadImageCache()[title] || '' : ''));

  useEffect(() => {
    let alive = true;
    setSrc(title ? loadImageCache()[title] || '' : '');
    if (title) fetchImages([title]).then((found) => { if (alive) setSrc(found[title] || ''); });
    return () => { alive = false; };
  }, [title]);

  if (!src) return null;
  const img = (
    <img
      className={`wiki-image ${className}`.trim()}
      src={src}
      alt={alt || ''}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => { forgetImage(title); setSrc(''); }}
    />
  );
  // `link` leads to the article the picture came from, where its author and
  // license are shown.
  if (!link) return img;
  return (
    <a
      className="wiki-image-link"
      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`}
      target="_blank"
      rel="noreferrer"
      title="Picture from this Wikipedia article"
    >
      {img}
    </a>
  );
}
