function compact(value) {
  if (Array.isArray(value)) return value.map(compact).filter(Boolean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, nested]) => [key, compact(nested)])
        .filter(([, nested]) => nested !== undefined && nested !== '' && !(Array.isArray(nested) && nested.length === 0))
    );
  }
  return value;
}

function cityState(location = '') {
  const [city, region] = String(location).split(',').map((part) => part.trim());
  return { city, region };
}

export function sportsEventJsonLd(config = {}) {
  const { city, region } = cityState(config.event?.location || '');
  const distances = Array.isArray(config.distances) ? config.distances : [];
  const offers = config.registration?.url
    ? distances.map((distance) => ({
        '@type': 'Offer',
        name: distance.name,
        url: config.registration.url,
        availability: 'https://schema.org/InStock',
        price: distance.price_amount,
        priceCurrency: distance.price_currency || 'USD'
      }))
    : [];

  return compact({
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: config.identity?.name,
    description: config.seo?.meta_description || config.identity?.tagline,
    startDate: config.event?.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    sport: 'Running',
    url: config.site?.url,
    location: {
      '@type': 'Place',
      name: config.event?.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: region,
        addressCountry: config.event?.country || 'US'
      }
    },
    organizer: config.organization?.name ? {
      '@type': 'Organization',
      name: config.organization.name,
      url: config.organization.url
    } : undefined,
    subEvent: distances.map((distance) => ({
      '@type': 'SportsEvent',
      name: `${config.identity?.name || 'Race'} ${distance.name}`,
      startDate: distance.start_datetime || config.event?.date,
      sport: 'Running',
      distance: distance.distance
    })),
    offers
  });
}

export function sportsEventJsonLdScript(config = {}) {
  return `<script type="application/ld+json">${JSON.stringify(sportsEventJsonLd(config)).replace(/</g, '\\u003c')}</script>`;
}
