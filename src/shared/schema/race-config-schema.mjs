const TEMPLATE_IDS = new Set(['destination-major', 'performance', 'community']);
const URL_PATTERN = /^https?:\/\//i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIVATE_MOCKUP_TOKEN_PATTERN = /^[a-f0-9]{32,}$/i;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function add(errors, path, message) {
  errors.push({ path, message });
}

function warn(warnings, path, message) {
  warnings.push({ path, message });
}

export function validateRaceConfig(config) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(config)) {
    return { ok: false, errors: [{ path: '$', message: 'Config must be a JSON object.' }], warnings };
  }

  if (!isPlainObject(config.identity)) {
    add(errors, 'identity', 'Identity block is required.');
  } else {
    if (!hasText(config.identity.template)) add(errors, 'identity.template', 'Template id is required.');
    else if (!TEMPLATE_IDS.has(config.identity.template)) add(errors, 'identity.template', `Template must be one of: ${Array.from(TEMPLATE_IDS).join(', ')}.`);
    if (!hasText(config.identity.name)) add(errors, 'identity.name', 'Race name is required.');
    if (!isPlainObject(config.identity.colors)) warn(warnings, 'identity.colors', 'Brand colors are recommended for Starter/Standard setup.');
    else if (!hasText(config.identity.colors.primary)) warn(warnings, 'identity.colors.primary', 'Primary brand color is recommended.');
  }

  if (!isPlainObject(config.event)) {
    add(errors, 'event', 'Event block is required.');
  } else {
    if (!hasText(config.event.date)) add(errors, 'event.date', 'Event date is required in YYYY-MM-DD format.');
    else if (!DATE_PATTERN.test(config.event.date)) add(errors, 'event.date', 'Event date must use YYYY-MM-DD format.');
    if (!hasText(config.event.location)) add(errors, 'event.location', 'Event location is required.');
  }

  if (!Array.isArray(config.distances) || config.distances.length === 0) {
    add(errors, 'distances', 'At least one race distance is required.');
  } else {
    const ids = new Set();
    config.distances.forEach((distance, index) => {
      const base = `distances[${index}]`;
      if (!isPlainObject(distance)) {
        add(errors, base, 'Distance must be an object.');
        return;
      }
      if (!hasText(distance.id)) add(errors, `${base}.id`, 'Distance id is required.');
      else if (ids.has(distance.id)) add(errors, `${base}.id`, 'Distance id must be unique.');
      else ids.add(distance.id);
      if (!hasText(distance.name)) add(errors, `${base}.name`, 'Distance name is required.');
      if (!hasText(distance.distance)) add(errors, `${base}.distance`, 'Display distance is required, e.g. "26.2 mi".');
      if (!hasText(distance.start_time)) warn(warnings, `${base}.start_time`, 'Start time is recommended for launch readiness.');
    });
  }

  if (!isPlainObject(config.registration)) {
    add(errors, 'registration', 'Registration block is required.');
  } else {
    if (!hasText(config.registration.url)) add(errors, 'registration.url', 'Registration URL is required.');
    else if (!URL_PATTERN.test(config.registration.url)) add(errors, 'registration.url', 'Registration URL must be absolute and start with http:// or https://.');
    if (!hasText(config.registration.cta_label)) warn(warnings, 'registration.cta_label', 'CTA label is recommended; default copy may be used otherwise.');
  }

  if (!isPlainObject(config.seo)) {
    add(errors, 'seo', 'SEO block is required.');
  } else {
    if (!hasText(config.seo.meta_title)) add(errors, 'seo.meta_title', 'Meta title is required.');
    if (!hasText(config.seo.meta_description)) add(errors, 'seo.meta_description', 'Meta description is required.');
    else if (config.seo.meta_description.length > 170) warn(warnings, 'seo.meta_description', 'Meta description is longer than 170 characters.');
  }

  if (config.analytics !== undefined) {
    if (!isPlainObject(config.analytics)) add(errors, 'analytics', 'Analytics must be an object when provided.');
    else if (config.analytics.ga4_measurement_id && !/^G-[A-Z0-9]+$/.test(config.analytics.ga4_measurement_id)) {
      add(errors, 'analytics.ga4_measurement_id', 'GA4 measurement id should look like G-XXXXXXXXXX.');
    }
  }

  if (config.contacts?.race_director_email && !EMAIL_PATTERN.test(config.contacts.race_director_email)) {
    add(errors, 'contacts.race_director_email', 'Race director email must be a valid email address.');
  }

  if (config.private_mockup !== undefined) {
    if (!isPlainObject(config.private_mockup)) {
      add(errors, 'private_mockup', 'Private mockup metadata must be an object when provided.');
    } else {
      if (!PRIVATE_MOCKUP_TOKEN_PATTERN.test(config.private_mockup.access_token || '')) {
        add(errors, 'private_mockup.access_token', 'Private mockup access token must be 32+ hex characters generated from at least 128 bits of crypto randomness.');
      }
      const expectedRoute = `/private/mockups/${config.private_mockup.access_token}/`;
      if (config.private_mockup.route !== expectedRoute) {
        add(errors, 'private_mockup.route', `Private mockup route must be tokenized as ${expectedRoute}.`);
      }
      if (!config.private_mockup.noindex) {
        add(errors, 'private_mockup.noindex', 'Private mockups must explicitly set noindex: true.');
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function launchGateChecks(config) {
  const schema = validateRaceConfig(config);
  const checks = [
    { id: 'schema-valid', label: 'Customer config passes schema validation', pass: schema.ok, details: schema.errors.map((error) => `${error.path}: ${error.message}`) },
    { id: 'registration-url', label: 'Registration URL is present and absolute', pass: /^https?:\/\//i.test(config?.registration?.url || '') },
    { id: 'seo-metadata', label: 'SEO title and description are present', pass: hasText(config?.seo?.meta_title) && hasText(config?.seo?.meta_description) },
    { id: 'event-date', label: 'Event date is present in YYYY-MM-DD format', pass: DATE_PATTERN.test(config?.event?.date || '') },
    { id: 'distances', label: 'At least one race distance is configured', pass: Array.isArray(config?.distances) && config.distances.length > 0 },
    { id: 'analytics-ready', label: 'GA4 measurement id is configured or intentionally omitted', pass: config?.analytics === undefined || hasText(config.analytics?.ga4_measurement_id), details: config?.analytics?.ga4_measurement_id ? [] : ['No secrets are required; add PUBLIC_GA4_MEASUREMENT_ID or analytics.ga4_measurement_id when available.'] }
  ];

  return {
    ok: checks.every((check) => check.pass),
    checks,
    warnings: schema.warnings
  };
}
