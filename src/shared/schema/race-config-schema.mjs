import { PRIVATE_VALUE_SUPPORTED_TEMPLATES } from '../private-mockup-value.mjs';

const TEMPLATE_IDS = new Set(PRIVATE_VALUE_SUPPORTED_TEMPLATES);
const URL_PATTERN = /^https?:\/\//i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIVATE_MOCKUP_TOKEN_PATTERN = /^[a-f0-9]{32,}$/i;
const STARTLINE_VALUE_STRING_FIELDS = ['headline', 'intro'];
const STARTLINE_VALUE_ARRAY_FIELDS = ['improved', 'paid_includes'];
const REGISTRATION_STATUSES = new Set(['open', 'limited', 'waitlist', 'sold_out', 'transfer_only', 'closed']);
const RUNNER_CHECKLIST_ITEM_IDS = new Set([
  'date',
  'distance',
  'start-time',
  'location',
  'price',
  'packet-pickup',
  'course',
  'aid-stations',
  'refunds-transfers',
  'swag',
  'awards',
  'time-limit',
  'parking',
  'post-race',
  'series',
  'facebook',
  'photo-id',
  'age-eligibility'
]);

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
    if (config.registration.status !== undefined && !REGISTRATION_STATUSES.has(config.registration.status)) {
      add(errors, 'registration.status', `Registration status must be one of: ${Array.from(REGISTRATION_STATUSES).join(', ')}.`);
    }
    ['status_label', 'status_detail', 'status_cta_label'].forEach((field) => {
      if (config.registration[field] !== undefined && !hasText(config.registration[field])) {
        add(errors, `registration.${field}`, 'Registration status copy must be a non-empty string when provided.');
      }
    });
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

  if (config.social !== undefined) {
    if (!isPlainObject(config.social)) {
      add(errors, 'social', 'Social/contact links must be an object when provided.');
    } else {
      ['facebook', 'instagram', 'twitter', 'x'].forEach((field) => {
        if (config.social[field] !== undefined) {
          if (!hasText(config.social[field])) add(errors, `social.${field}`, 'Social URL must be a non-empty string when provided.');
          else if (!URL_PATTERN.test(config.social[field])) add(errors, `social.${field}`, 'Social URL must be absolute and start with http:// or https://.');
        }
      });
      if (config.social.email !== undefined) {
        const email = hasText(config.social.email) ? config.social.email.replace(/^mailto:/i, '') : '';
        if (!email) add(errors, 'social.email', 'Social email must be a non-empty string when provided.');
        else if (!EMAIL_PATTERN.test(email)) add(errors, 'social.email', 'Social email must be a valid email address.');
      }
      if (config.social.twitter && config.social.x) {
        warn(warnings, 'social.x', 'Both social.twitter and social.x are configured; templates prefer social.x.');
      }
    }
  }

  if (config.photo_galleries !== undefined) {
    if (!Array.isArray(config.photo_galleries)) {
      add(errors, 'photo_galleries', 'Photo galleries must be an array when provided.');
    } else {
      config.photo_galleries.forEach((gallery, index) => {
        const base = `photo_galleries[${index}]`;
        if (!isPlainObject(gallery)) {
          add(errors, base, 'Photo gallery must be an object.');
          return;
        }
        if (!hasText(gallery.label)) add(errors, `${base}.label`, 'Photo gallery label is required.');
        if (!hasText(gallery.url) || !URL_PATTERN.test(gallery.url)) add(errors, `${base}.url`, 'Photo gallery URL must be absolute and start with http:// or https://.');
        if (gallery.provider !== undefined && !hasText(gallery.provider)) add(errors, `${base}.provider`, 'Photo gallery provider must be non-empty when provided.');
        if (gallery.year !== undefined && !hasText(gallery.year)) add(errors, `${base}.year`, 'Photo gallery year must be non-empty when provided.');
      });
    }
  }

  if (config.photo_galleries_intro !== undefined) {
    if (!isPlainObject(config.photo_galleries_intro)) {
      add(errors, 'photo_galleries_intro', 'Photo galleries intro must be an object when provided.');
    } else {
      for (const field of ['kicker', 'title', 'lead']) {
        if (config.photo_galleries_intro[field] !== undefined && !hasText(config.photo_galleries_intro[field])) {
          add(errors, `photo_galleries_intro.${field}`, 'Photo galleries intro fields must be non-empty strings when provided.');
        }
      }
    }
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
      if (!hasText(config.private_mockup.template)) {
        add(errors, 'private_mockup.template', 'Private mockups must declare the template used for routing.');
      } else if (!TEMPLATE_IDS.has(config.private_mockup.template)) {
        add(errors, 'private_mockup.template', `Template must be one of: ${Array.from(TEMPLATE_IDS).join(', ')}.`);
      } else if (config.identity?.template && config.private_mockup.template !== config.identity.template) {
        add(errors, 'private_mockup.template', 'Private mockup template must match identity.template.');
      }
    }
  }

  if (config.startline_value !== undefined) {
    if (!isPlainObject(config.startline_value)) {
      add(errors, 'startline_value', 'StartLine value narrative must be an object when provided.');
    } else {
      for (const field of STARTLINE_VALUE_STRING_FIELDS) {
        if (config.startline_value[field] !== undefined && !hasText(config.startline_value[field])) {
          add(errors, `startline_value.${field}`, 'Must be a non-empty string when provided.');
        }
      }
      for (const field of STARTLINE_VALUE_ARRAY_FIELDS) {
        if (config.startline_value[field] === undefined) continue;
        if (!Array.isArray(config.startline_value[field])) {
          add(errors, `startline_value.${field}`, 'Must be an array of non-empty strings when provided.');
        } else {
          config.startline_value[field].forEach((item, index) => {
            if (!hasText(item)) add(errors, `startline_value.${field}[${index}]`, 'Must be a non-empty string.');
          });
        }
      }
    }
  }

  if (config.runner_decision_checklist !== undefined) {
    if (!isPlainObject(config.runner_decision_checklist)) {
      add(errors, 'runner_decision_checklist', 'Runner decision checklist must be an object when provided.');
    } else {
      const checklist = config.runner_decision_checklist;
      if (!hasText(checklist.headline)) add(errors, 'runner_decision_checklist.headline', 'Headline is required.');
      if (!hasText(checklist.intro)) add(errors, 'runner_decision_checklist.intro', 'Intro is required.');
      if (!Array.isArray(checklist.items) || checklist.items.length === 0) {
        add(errors, 'runner_decision_checklist.items', 'At least one checklist item is required when checklist is provided.');
      } else {
        const itemIds = new Set();
        const distanceIds = new Set(Array.isArray(config.distances) ? config.distances.map((distance) => distance?.id).filter(Boolean) : []);
        checklist.items.forEach((item, index) => {
          const base = `runner_decision_checklist.items[${index}]`;
          if (!isPlainObject(item)) {
            add(errors, base, 'Checklist item must be an object.');
            return;
          }
          if (!hasText(item.id)) add(errors, `${base}.id`, 'Checklist item id is required.');
          else if (!RUNNER_CHECKLIST_ITEM_IDS.has(item.id)) add(errors, `${base}.id`, 'Checklist item id is not recognized.');
          else if (itemIds.has(item.id)) add(errors, `${base}.id`, 'Checklist item id must be unique.');
          else itemIds.add(item.id);
          if (!hasText(item.label)) add(errors, `${base}.label`, 'Checklist item label is required.');
          if (!hasText(item.value)) add(errors, `${base}.value`, 'Checklist item value is required; omit unknown facts instead of using placeholders.');
          if (item.detail !== undefined && !hasText(item.detail)) add(errors, `${base}.detail`, 'Checklist item detail must be non-empty when provided.');
          if (item.source_path !== undefined && !hasText(item.source_path)) add(errors, `${base}.source_path`, 'Checklist source path must be non-empty when provided.');
          if (item.source_url !== undefined && (!hasText(item.source_url) || !URL_PATTERN.test(item.source_url))) add(errors, `${base}.source_url`, 'Checklist source URL must be absolute when provided.');
          if (item.applies_to_distance_ids !== undefined) {
            if (!Array.isArray(item.applies_to_distance_ids)) add(errors, `${base}.applies_to_distance_ids`, 'Must be an array of configured distance ids when provided.');
            else item.applies_to_distance_ids.forEach((id, idIndex) => {
              if (!hasText(id)) add(errors, `${base}.applies_to_distance_ids[${idIndex}]`, 'Distance id must be non-empty.');
              else if (distanceIds.size && !distanceIds.has(id)) add(errors, `${base}.applies_to_distance_ids[${idIndex}]`, 'Distance id must match a configured distance.');
            });
          }
        });
      }
    }
  }

  if (config.travel_logistics !== undefined) {
    if (!isPlainObject(config.travel_logistics)) {
      add(errors, 'travel_logistics', 'Travel logistics must be an object when provided.');
    } else {
      const travel = config.travel_logistics;
      if (travel.headline !== undefined && !hasText(travel.headline)) add(errors, 'travel_logistics.headline', 'Headline must be non-empty when provided.');
      if (travel.intro !== undefined && !hasText(travel.intro)) add(errors, 'travel_logistics.intro', 'Intro must be non-empty when provided.');
      if (travel.links_label !== undefined && !hasText(travel.links_label)) add(errors, 'travel_logistics.links_label', 'Links label must be non-empty when provided.');
      if (travel.items !== undefined) {
        if (!Array.isArray(travel.items)) {
          add(errors, 'travel_logistics.items', 'Travel logistics items must be an array when provided.');
        } else {
          const itemIds = new Set();
          travel.items.forEach((item, index) => {
            const base = `travel_logistics.items[${index}]`;
            if (!isPlainObject(item)) {
              add(errors, base, 'Travel logistics item must be an object.');
              return;
            }
            if (!hasText(item.id)) add(errors, `${base}.id`, 'Travel logistics item id is required.');
            else if (itemIds.has(item.id)) add(errors, `${base}.id`, 'Travel logistics item id must be unique.');
            else itemIds.add(item.id);
            if (item.label !== undefined && !hasText(item.label)) add(errors, `${base}.label`, 'Item label must be non-empty when provided.');
            if (!hasText(item.title)) add(errors, `${base}.title`, 'Item title is required.');
            if (!hasText(item.text)) add(errors, `${base}.text`, 'Item text is required.');
            if (item.icon !== undefined && !hasText(item.icon)) add(errors, `${base}.icon`, 'Item icon must be non-empty when provided.');
            if (item.source_path !== undefined && !hasText(item.source_path)) add(errors, `${base}.source_path`, 'Item source path must be non-empty when provided.');
            if (item.source_url !== undefined && (!hasText(item.source_url) || !URL_PATTERN.test(item.source_url))) add(errors, `${base}.source_url`, 'Item source URL must be absolute when provided.');
          });
        }
      }
      if (travel.links !== undefined) {
        if (!Array.isArray(travel.links)) {
          add(errors, 'travel_logistics.links', 'Travel logistics links must be an array when provided.');
        } else {
          travel.links.forEach((link, index) => {
            const base = `travel_logistics.links[${index}]`;
            if (!isPlainObject(link)) {
              add(errors, base, 'Travel logistics link must be an object.');
              return;
            }
            if (!hasText(link.label)) add(errors, `${base}.label`, 'Link label is required.');
            if (!hasText(link.url) || !URL_PATTERN.test(link.url)) add(errors, `${base}.url`, 'Link URL must be absolute.');
            if (link.source_path !== undefined && !hasText(link.source_path)) add(errors, `${base}.source_path`, 'Link source path must be non-empty when provided.');
            if (link.source_url !== undefined && (!hasText(link.source_url) || !URL_PATTERN.test(link.source_url))) add(errors, `${base}.source_url`, 'Link source URL must be absolute when provided.');
          });
        }
      }
    }
  }

  if (config.sponsors !== undefined) {
    if (!Array.isArray(config.sponsors)) {
      add(errors, 'sponsors', 'Sponsors must be an array when provided.');
    } else {
      config.sponsors.forEach((sponsor, index) => {
        const base = `sponsors[${index}]`;
        if (typeof sponsor === 'string') {
          if (!hasText(sponsor)) add(errors, base, 'Sponsor name must be non-empty.');
          return;
        }
        if (!isPlainObject(sponsor)) {
          add(errors, base, 'Sponsor must be a string or an object.');
          return;
        }
        if (!hasText(sponsor.name)) add(errors, `${base}.name`, 'Sponsor object requires a non-empty name.');
        if (sponsor.tier !== undefined && !hasText(sponsor.tier)) add(errors, `${base}.tier`, 'Sponsor tier must be non-empty when provided.');
        if (sponsor.url !== undefined && (!hasText(sponsor.url) || !URL_PATTERN.test(sponsor.url))) add(errors, `${base}.url`, 'Sponsor URL must be absolute when provided.');
      });
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
