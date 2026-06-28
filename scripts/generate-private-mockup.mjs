#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIVATE_VALUE_SUPPORTED_TEMPLATES } from '../src/shared/private-mockup-value.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const userAgent = 'StartLine private mockup generator (+https://startline.example; public preview capture)';
const supportedTemplateList = PRIVATE_VALUE_SUPPORTED_TEMPLATES.join('|');
const supportedTemplateCopy = PRIVATE_VALUE_SUPPORTED_TEMPLATES.join(', ');

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exit(1);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Usage: npm run mockup:private -- --url https://race-site.example [--slug race-slug] [--template ${supportedTemplateList}] [--token 32-hex-token]

Generates a private/noindex StartLine concept preview config.
Access URLs are always tokenized: /private/mockups/<32+ hex chars>/
Only source-backed facts are populated; missing or uncertain fields are recorded in private_mockup.uncertainties.
If --token is omitted, a cryptographically random 128-bit token is generated.`);
    return;
  }

  if (!args.url) {
    console.error(`Usage: npm run mockup:private -- --url https://race-site.example [--slug race-slug] [--template ${supportedTemplateList}] [--token 32-hex-token]`);
    process.exit(1);
  }

  const sourceUrl = new URL(args.url).toString();
  const template = args.template || 'community';
  if (!PRIVATE_VALUE_SUPPORTED_TEMPLATES.includes(template)) {
    console.error(`Private mockup generation supports ${supportedTemplateCopy} templates only.`);
    process.exit(1);
  }

  const capturedAt = new Date().toISOString();
  const page = await fetchText(sourceUrl);
  const facts = extractFacts(page, sourceUrl);
  const slug = sanitizeSlug(args.slug || facts.name?.value || new URL(sourceUrl).hostname.replace(/^www\./, ''));
  const token = args.token || generateAccessToken();
  if (!isValidAccessToken(token)) {
    console.error('Private mockup tokens must be at least 128 bits of entropy encoded as 32+ hex characters. Omit --token to generate one safely.');
    process.exit(1);
  }

  const missingRequired = ['name', 'eventDate', 'location', 'distances'].filter((key) => {
    if (key === 'distances') return facts.distances.length === 0;
    return !facts[key]?.value;
  });
  if (missingRequired.length) {
    console.error(`Source page did not expose required launch-safe facts: ${missingRequired.join(', ')}.`);
    console.error('No config was written. Re-run with a more specific public event URL or hand-author a source-backed config.');
    process.exit(1);
  }

  const assets = await captureImages(facts.images.map((image) => image.value), token);
  const config = buildConfig(facts, assets, { sourceUrl, capturedAt, slug, token, template });

  const outDir = path.join(root, 'src/data/private-mockups');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}.json`);
  await writeFile(outPath, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`Private mockup config written: ${path.relative(root, outPath)}`);
  console.log(`Private preview route: /private/mockups/${token}/`);
  console.log(`Private access token: ${token}`);
  console.log(`Captured public images: ${assets.length}`);
  console.log(`Source-backed facts: ${config.private_mockup.provenance.items.length}`);
  console.log(`Uncertainties recorded: ${config.private_mockup.uncertainty.items.length}`);
  assets.forEach((asset) => console.log(`- ${asset.src} (${asset.source})`));
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--url') parsed.url = argv[++i];
    else if (arg === '--slug') parsed.slug = argv[++i];
    else if (arg === '--template') parsed.template = argv[++i];
    else if (arg === '--token') parsed.token = argv[++i];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
  }
  return parsed;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' } });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: ${response.status} ${response.statusText}`);
  return response.text();
}

function extractFacts(html, baseUrl) {
  const jsonLd = extractJsonLd(html).find((item) => String(item?.['@type'] || '').toLowerCase().includes('event')) || {};
  const h1 = fact(decode(tagText(html, 'h1')), 'h1', 'high');
  const title = fact(decode(meta(html, 'property', 'og:title') || meta(html, 'name', 'twitter:title') || tagText(html, 'title')), 'page metadata/title', 'medium');
  const visibleText = htmlToText(html);
  const sourceSections = extractSourceSections(visibleText);
  const description = extractDescription(html, jsonLd, visibleText);
  const name = selectName(h1, title);
  const eventDate = normalizeDate(jsonLd.startDate)
    ? fact(normalizeDate(jsonLd.startDate), 'JSON-LD startDate', 'high')
    : extractDate(visibleText);
  const location = normalizeLocation(jsonLd.location)
    ? fact(normalizeLocation(jsonLd.location), 'JSON-LD location', 'high')
    : extractLocation(visibleText, eventDate?.raw);
  const startTime = extractStartTime(visibleText);
  const distances = extractDistances({ name: name?.value || '', title: title?.value || '', h1: h1?.value || '', text: visibleText, startTime });
  const registrationUrl = extractRegistrationUrl(html, baseUrl) || fact(baseUrl, 'source URL', 'medium');
  const price = extractPrice(visibleText);
  const certification = extractCertification(visibleText);
  const aidStations = extractAidStations(visibleText);
  const courseProfile = extractCourseProfile(visibleText);
  const scheduleItems = extractScheduleItems(sourceSections, { eventDate, location, distances });
  const faqs = extractFaqs(sourceSections);
  const images = [
    meta(html, 'property', 'og:image'),
    meta(html, 'name', 'twitter:image'),
    ...Array.from(html.matchAll(/<img\b[^>]*?src=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1])
  ].filter(Boolean).map((src) => safeResolve(src, baseUrl)).filter(Boolean).map((url) => fact(url, 'public image URL on source page', 'medium'));

  return {
    name,
    title,
    description,
    eventDate,
    location,
    startTime,
    distances,
    registrationUrl,
    price,
    certification,
    aidStations,
    courseProfile,
    sourceSections,
    scheduleItems,
    faqs,
    images: uniqueFacts(images).slice(0, 12),
    uncertainties: buildUncertainties({ eventDate, location, startTime, distances, price, certification, aidStations, courseProfile, images })
  };
}

function extractDescription(html, jsonLd, visibleText) {
  const about = visibleText.match(/ABOUT\s+(.{80,900}?)(?:\s+REGISTRATION\b|\s+PACKET PICK-UP\b)/i)?.[1];
  if (about) return fact(about.trim(), 'ABOUT section text', 'medium');
  const value = decode(meta(html, 'name', 'description') || meta(html, 'property', 'og:description') || jsonLd.description || '');
  if (value && !looksTruncated(value)) return fact(value, 'page description metadata', 'medium');
  return null;
}

function extractSourceSections(text) {
  const markers = [
    'ABOUT',
    'REGISTRATION',
    'PACKET PICK-UP',
    'RACE DAY SCHEDULE',
    'PARKING',
    'COURSE',
    'AID STATIONS / FLUIDS',
    'ELITE ATHLETES',
    'TIMING/RESULTS',
    'AWARDS & PRIZE MONEY',
    'Post-Race Awards & Celebration',
    'ALL-TIME TOP 10 LISTS'
  ];
  const sections = {};
  markers.forEach((marker) => {
    const start = text.search(new RegExp(`\\b${escapeRegExp(marker)}\\b`));
    if (start < 0) return;
    const rest = text.slice(start + marker.length);
    const nextMarkers = markers.filter((candidate) => candidate !== marker).map(escapeRegExp).join('|');
    const next = rest.search(new RegExp(`\\b(?:${nextMarkers})\\b`));
    const sectionText = (next >= 0 ? rest.slice(0, next) : rest).replace(/\s+/g, ' ').trim();
    const key = marker.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (sectionText) sections[key] = fact(sectionText, `${marker} section text`, 'medium');
  });
  return sections;
}

function extractScheduleItems(sections, { eventDate, location, distances }) {
  const items = [];
  const raceDay = eventDate?.value ? formatDateForCopy(eventDate.value) : 'Race Day';
  const distanceIds = distances.map((distance) => distance.id);
  const add = (day, name, time, itemLocation, source) => {
    if (!time || items.some((item) => item.day === day && item.name === name && item.time === time)) return;
    items.push(removeUndefined({ day, name, time: formatTimeLabel(time), location: itemLocation, applies_to_distances: distanceIds, provenance: source }));
  };

  const packet = sections.packet_pick_up?.value || '';
  const packetMatch = packet.match(/at\s+(.+?)\s+from\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm))\s*[–-]\s*([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm))\s+on\s+([^.]*)/i);
  if (packetMatch) {
    add(packetMatch[4].trim().replace(/\s+/g, ' '), 'Packet pick-up', `${packetMatch[2]} – ${packetMatch[3]}`, packetMatch[1].trim(), sections.packet_pick_up);
  }

  const schedule = sections.race_day_schedule?.value || '';
  Array.from(schedule.matchAll(/([0-9]{1,2}:[0-9]{2}\s*(?:am|pm))\s*[–-]\s*([^0-9]+?)(?=\s+[0-9]{1,2}:[0-9]{2}\s*(?:am|pm)\s*[–-]|$)/gi)).forEach((match) => {
    const name = match[2].replace(/\s+/g, ' ').trim().replace(/\s+Free parking.*$/i, '');
    if (/\bTBC\b/i.test(name)) return;
    add(raceDay, name, match[1], location?.value, sections.race_day_schedule);
  });
  return items;
}

function extractFaqs(sections) {
  const faqs = [];
  const add = (question, answer, source) => {
    const extracted = extractStructuredLinks(answer);
    const cleaned = cleanSentence(extracted.text, 360);
    if (cleaned && !faqs.some((item) => item.question === question)) {
      faqs.push({
        question,
        answer: cleaned,
        ...(extracted.links.length ? { links: uniqueLinks(extracted.links).slice(0, 3) } : {}),
        provenance: source
      });
    }
  };

  const registration = sections.registration?.value || '';
  const refund = registration.match(/In the event that you are unable[^.]+\.\s*However,[^.]+\./i)?.[0];
  if (refund) add('What is the refund or transfer policy?', refund, sections.registration);
  const swag = registration.match(/Each participant[^.]+\.\s*All finishers[^.]+\./i)?.[0];
  if (swag) add('What do participants receive?', swag, sections.registration);

  const packet = sections.packet_pick_up?.value || '';
  if (packet) add('Where is packet pick-up?', packet, sections.packet_pick_up);

  const course = sections.course?.value || '';
  const limit = course.match(/the course is only open for 3 hours[^.]+\./i)?.[0];
  if (limit) add('Is there a course time limit?', limit, sections.course);

  const aid = sections.aid_stations_fluids?.value || '';
  const aidSummary = aid.match(/We will have crewed aid stations[^.]+\.\s*We will NOT be handing out gels[^.]+\./i)?.[0];
  if (aidSummary) add('What is available at aid stations?', aidSummary, sections.aid_stations_fluids);

  const awards = sections.awards_prize_money?.value || '';
  const awardsSummary = awards.match(/Prizing is as follows:.{0,260}?Age Groups:[^.]+\./i)?.[0];
  if (awardsSummary) add('Are awards or prize money listed?', awardsSummary, sections.awards_prize_money);
  return faqs.slice(0, 6);
}

function selectName(h1, title) {
  if (h1?.value && /\b(race|marathon|half|10k|5k|ultra|trail|run)\b/i.test(h1.value)) return h1;
  const cleaned = cleanTitle(title?.value || '');
  return cleaned ? fact(cleaned, title?.source || 'title', title?.confidence || 'medium') : null;
}

function extractDate(text) {
  const datePattern = /(?:(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,]?\s*)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})/gi;
  const matches = Array.from(text.matchAll(datePattern));
  if (!matches.length) return null;
  const scored = matches.map((match) => {
    const raw = match[0].trim();
    const context = text.slice(Math.max(0, match.index - 160), Math.min(text.length, match.index + raw.length + 160));
    let score = 0;
    if (match[1]) score += 5;
    if (/\|\s*[A-Z][A-Za-z .'-]+,\s*[A-Z]{2}\s+Start time/i.test(context)) score += 6;
    if (/\b(half|marathon|race|event)\b/i.test(context)) score += 3;
    if (/\bSkip to content\b/i.test(context) && !match[1]) score -= 5;
    return { match, raw, score };
  }).sort((a, b) => b.score - a.score);
  const selected = scored[0];
  const value = normalizeDate(`${selected.match[2]} ${selected.match[3]}, ${selected.match[4]}`);
  return value ? fact(value, `source text: "${selected.raw}"`, 'high', selected.raw) : null;
}

function extractLocation(text, dateRaw) {
  const escapedDate = dateRaw ? escapeRegExp(dateRaw) : null;
  const patterns = [
    escapedDate ? new RegExp(`${escapedDate}\\s*\\|\\s*([^|.]+?,\\s*[A-Z]{2})`, 'i') : null,
    /\|\s*([^|.]+?,\s*[A-Z]{2})\s+Start time/i,
    /(?:at|in)\s+([A-Z][A-Za-z .'-]+,\s*[A-Z]{2})\b/
  ].filter(Boolean);
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return fact(match[1].trim(), `source text near date/location: "${match[0].trim()}"`, 'high');
  }
  return null;
}

function extractStartTime(text) {
  const match = text.match(/Start time:\s*([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm))/i);
  if (!match) return null;
  return fact(formatTime(match[1]), `source text: "${match[0].trim()}"`, 'high');
}

function extractDistances({ name, title, h1, startTime }) {
  const source = [h1, title, name].filter(Boolean).join(' | ');
  const distances = [];
  const addDistance = (id, distanceName, distance, matched) => {
    if (distances.some((item) => item.id === id)) return;
    distances.push({
      id,
      name: distanceName,
      distance,
      featured: distances.length === 0,
      ...(startTime?.value ? { start_time: startTime.value } : {}),
      provenance: fact(distanceName, `event name/title: "${matched}"`, 'high')
    });
  };

  if (/\bhalf(?:[-\s]?marathon)?\b/i.test(source)) addDistance('half-marathon', 'Half Marathon', '13.1 mi', source.match(/[^|]*half[^|]*/i)?.[0]?.trim() || source);
  if (/\bmarathon\b/i.test(source) && !/half[-\s]?marathon/i.test(source)) addDistance('marathon', 'Marathon', '26.2 mi', source.match(/[^|]*marathon[^|]*/i)?.[0]?.trim() || source);
  if (/\b10\s?k\b/i.test(source)) addDistance('10k', '10K', '6.2 mi', source.match(/[^|]*10\s?k[^|]*/i)?.[0]?.trim() || source);
  if (/\b5\s?k\b/i.test(source)) addDistance('5k', '5K', '3.1 mi', source.match(/[^|]*5\s?k[^|]*/i)?.[0]?.trim() || source);
  if (/\bkids?\b.*\b(mile|run|dash)\b|\b(mile|run|dash)\b.*\bkids?\b/i.test(source)) addDistance('kids-run', "Kids' Run", '1 mi', source.match(/[^|]*kids?[^|]*/i)?.[0]?.trim() || source);

  return distances;
}

function extractRegistrationUrl(html, baseUrl) {
  const links = Array.from(html.matchAll(/<a\b[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map((match) => ({ href: safeResolve(match[1], baseUrl), text: htmlToText(match[2]) }))
    .filter((link) => link.href && !/\/results?\b|resultSetId|racetecresults|amatteroftiming/i.test(link.href + ' ' + link.text));
  const candidate = links.find((link) => /register|signup|sign up/i.test(link.text))
    || links.find((link) => /runsignup\.com\/Race\/[^/]+\/[^/]+\/[^/#?]+/i.test(link.href))
    || links.find((link) => /active\.com|raceentry|registration/i.test(link.href));
  return candidate ? fact(candidate.href, `registration link: "${candidate.text || candidate.href}"`, 'medium') : null;
}

function extractPrice(text) {
  const match = text.match(/Entry fee is\s*(\$\d+)/i) || text.match(/\b(\$\d+)\b[^.]{0,80}(?:until|through|entry|registration)/i);
  return match ? fact(match[1], `source text: "${match[0].trim()}"`, 'medium') : null;
}

function extractCertification(text) {
  const cert = text.match(/certification number is\s*([A-Z0-9-]+)/i);
  if (cert) return fact(`USATF certified #${cert[1]}`, `source text: "${cert[0].trim()}"`, 'high');
  const sanctioned = text.match(/USA Track\s*&\s*Field-sanctioned|USATF-certified/i);
  return sanctioned ? fact(sanctioned[0].replace(/&amp;/g, '&'), `source text: "${sanctioned[0]}"`, 'medium') : null;
}

function extractAidStations(text) {
  const section = text.match(/AID STATIONS?[\s\S]{0,700}?(?=ELITE ATHLETES|TIMING|AWARDS|$)/i)?.[0] || '';
  const miles = Array.from(section.matchAll(/\b\d+(?:\.\d+)?\s*miles?\b/gi)).map((match) => match[0]);
  return miles.length ? fact(miles.length, `AID STATIONS section lists: ${miles.join(', ')}`, 'high') : null;
}

function extractCourseProfile(text) {
  const phrases = [];
  if (/fast, flat/i.test(text)) phrases.push('Fast, flat');
  if (/USATF-certified/i.test(text)) phrases.push('USATF-certified');
  if (/Cumberland River|river/i.test(text)) phrases.push('Riverside');
  return phrases.length ? fact(phrases.join(' · '), `source text mentions: ${phrases.join(', ')}`, 'medium') : null;
}

function buildUncertainties(facts) {
  const uncertainties = [];
  if (!facts.startTime) uncertainties.push('Start time was not found in the source page; omitted from distance details.');
  if (!facts.price) uncertainties.push('Current entry price was not found with high confidence; omitted from distance cards.');
  if (!facts.certification) uncertainties.push('Course certification/sanctioning was not found with high confidence; omitted from course details.');
  if (!facts.aidStations) uncertainties.push('Aid-station count was not found with high confidence; omitted from course details.');
  if (!facts.courseProfile) uncertainties.push('Course profile descriptors were not found with high confidence; omitted from course details.');
  if (!facts.images.length) uncertainties.push('No usable public JPG/PNG/WebP images were captured; template illustration placeholders will be used.');
  if (facts.distances.length === 1) uncertainties.push('Only one event distance was confirmed from the event title/page heading; other distance mentions were treated as contextual unless presented as event distances.');
  return uncertainties;
}

function buildStory(facts) {
  const sections = facts.sourceSections || {};
  const links = [];
  const paragraphs = unique([
    facts.description?.value,
    sections.registration?.value ? cleanSentence(sections.registration.value, 520) : '',
    sections.course?.value ? cleanSentence(sections.course.value, 520) : '',
    sections.aid_stations_fluids?.value ? cleanSentence(sections.aid_stations_fluids.value, 420) : '',
    sections.post_race_awards_celebration?.value ? cleanSentence(sections.post_race_awards_celebration.value, 360) : ''
  ].filter(Boolean).map((item) => {
    const extracted = extractStructuredLinks(item);
    links.push(...extracted.links);
    return normalizeDisplayCopy(extracted.text);
  }).filter(Boolean)).slice(0, 5);

  return { paragraphs, links: uniqueLinks(links).slice(0, 4) };
}

function extractStructuredLinks(value) {
  const links = [];
  let text = String(value || '').replace(/\bhttps?:\/\/[^\s)\]}<>"']+/gi, (url) => {
    const cleanUrl = url.replace(/[.,;:!?]+$/g, '');
    const trailing = url.slice(cleanUrl.length);
    links.push({ label: labelForResourceUrl(cleanUrl), url: cleanUrl });
    return trailing;
  });

  text = text.replace(/\b(?:www\.)?runsignup\.com\b\s*\.?/gi, 'the official registration page');
  text = text.replace(/\(\s*see\s+links?\s+below\s*\)/gi, '');
  text = text.replace(/\bsee\s+links?\s+below\b\.?/gi, '');
  return { text, links };
}

function labelForResourceUrl(url) {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return 'View course resource'; }
  if (host.includes('strava.com')) return 'View Strava route';
  if (host.includes('runningahead.com')) return 'View RunningAHEAD map';
  if (host.includes('runsignup.com')) return 'View RunSignup registration';
  if (/map|route|course/i.test(url)) return 'View course resource';
  const label = host.split('.')[0]?.replace(/[-_]+/g, ' ');
  return label ? `View ${titleCase(label)} resource` : 'View source resource';
}

function uniqueLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (!link?.url || seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

function registrationDetails(url) {
  const details = { url, platform: 'other', cta_label: 'View official registration' };
  if (/runsignup\.com/i.test(url || '')) {
    details.platform = 'runsignup';
    details.cta_label = 'Register on RunSignup';
  }
  return details;
}

function organizationName(facts, sourceUrl) {
  const sourceText = [facts.description?.value, facts.sourceSections?.about?.value].filter(Boolean).join(' ');
  const club = sourceText.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+(?:Track Club|Running Club|Road Runners|Marathon|Athletics))\b/);
  if (club) return normalizeDisplayCopy(club[1]);
  const host = sourceHost(sourceUrl).split('.')[0].replace(/[-_]+/g, ' ');
  return titleCase(host);
}

function buildConfig(facts, assets, metaInfo) {
  const overview = facts.description?.value || `${facts.name.value} is listed for ${formatDateForCopy(facts.eventDate.value)} in ${facts.location.value}.`;
  const description = cleanSentence(extractStructuredLinks(overview).text, 165);
  const story = buildStory(facts);
  const distances = facts.distances.map((distance) => {
    const details = {
      id: distance.id,
      name: distance.name,
      distance: distance.distance,
      featured: distance.featured,
      provenance: {
        verified: true,
        source_url: metaInfo.sourceUrl,
        method: distance.provenance?.source || 'source page distance extraction'
      }
    };
    if (distance.start_time) details.start_time = distance.start_time;
    if (facts.price?.value) {
      details.price = facts.price.value;
      details.price_amount = facts.price.value.replace(/[^0-9.]/g, '');
    }
    if (facts.aidStations?.value) details.aid_stations = facts.aidStations.value;
    if (facts.courseProfile?.value) details.profile = facts.courseProfile.value;
    if (facts.certification?.value) details.certification = facts.certification.value;
    details.map_label = distance.name;
    details.highlights = [facts.certification?.value, facts.courseProfile?.value].filter(Boolean).slice(0, 2);
    return details;
  });
  const runnerDecisionChecklist = buildRunnerDecisionChecklist(facts, metaInfo);
  const identityColors = metaInfo.template === 'destination-major'
    ? { primary: '#FF5B2E', secondary: '#16324F' }
    : { primary: '#C6643D', secondary: '#6B8E6F' };

  return removeUndefined({
    identity: {
      template: metaInfo.template,
      name: facts.name.value,
      tagline: facts.name.value,
      edition: facts.location.value,
      ...(assets[0] ? { hero_image: { src: assets[0].src, alt: assets[0].alt, source: assets[0].source } } : {}),
      colors: identityColors
    },
    event: {
      date: facts.eventDate.value,
      location: facts.location.value,
      venue: facts.location.value
    },
    organization: { name: organizationName(facts, metaInfo.sourceUrl) },
    distances,
    registration: registrationDetails(facts.registrationUrl.value),
    startline_value: {
      headline: 'A race website concept built around registration intent — not just a prettier homepage.',
      intro: 'StartLine Sites reorganizes the information runners need before they register: date, location, distance, course details, schedule, policies, and the official registration link. The goal is to reduce friction, surface trust signals, and make the next click easier to find on mobile and desktop.',
      improved: [
        'Reduced runner friction by placing key race facts near the registration path.',
        'Surfaced trust signals from configured distances, schedule details, and FAQs when available.',
        'Made registration CTAs easier to find on mobile and desktop with measurement-ready registration-click tracking.'
      ],
      paid_includes: [
        'Mobile-first implementation shaped around the runner registration path.',
        'SEO-ready page structure and event metadata for clearer discovery and sharing.',
        'Registration-click tracking setup so runner intent can be measured after launch.',
        'No registration-growth guarantees — just a clearer, faster, more measurable path from runner interest to registration click-through.'
      ]
    },
    story: story.paragraphs.length ? {
      kicker: 'Race overview',
      title: `About ${facts.name.value}`,
      paragraphs: story.paragraphs,
      ...(story.links.length ? { links: story.links } : {}),
      ...(assets[1] ? { image: { src: assets[1].src, alt: `Course or race image for ${facts.name.value}`, source: assets[1].source } } : {})
    } : undefined,
    schedule: facts.scheduleItems.length ? facts.scheduleItems.map(({ provenance, ...item }) => item) : (facts.startTime?.value ? [{ day: formatDateForCopy(facts.eventDate.value), name: `${distances[0].name} start`, time: facts.startTime.value, location: facts.location.value, applies_to_distances: [distances[0].id] }] : []),
    faqs: facts.faqs.map(({ provenance, ...item }) => item),
    runner_decision_checklist: runnerDecisionChecklist,
    seo: {
      meta_title: `${facts.name.value} — Race Website Preview`,
      meta_description: description
    },
    analytics: undefined,
    private_mockup: {
      generated: true,
      noindex: true,
      source_url: metaInfo.sourceUrl,
      captured_at: metaInfo.capturedAt,
      access_token: metaInfo.token,
      race_slug: metaInfo.slug,
      route: `/private/mockups/${metaInfo.token}/`,
      template: metaInfo.template,
      assets,
      provenance: buildPrivateMockupProvenance(facts, metaInfo, { hasSchedule: Boolean(facts.startTime?.value), hasRunnerDecisionChecklist: Boolean(runnerDecisionChecklist?.items?.length) }),
      confidence: summarizeConfidence(facts),
      uncertainty: {
        summary: facts.uncertainties.length ? 'Some source facts were not available with high confidence and were omitted from rendered sections.' : 'Required private mockup fields were source-confirmed during capture.',
        items: facts.uncertainties
      },
      notes: 'Generated only from source-backed facts found on the public page. Sample race data and boilerplate are intentionally not copied into private mockups.'
    }
  });
}

function buildRunnerDecisionChecklist(facts, metaInfo) {
  const items = [];
  const sourceUrl = metaInfo.sourceUrl;
  const distanceIds = facts.distances.map((distance) => distance.id);
  const add = (id, label, value, options = {}) => {
    const cleanedValue = normalizeDisplayCopy(value);
    if (!cleanedValue || items.some((item) => item.id === id)) return;
    items.push(removeUndefined({
      id,
      label,
      value: cleanedValue,
      detail: options.detail ? normalizeDisplayCopy(options.detail) : undefined,
      source_path: options.sourcePath,
      source_url: sourceUrl,
      applies_to_distance_ids: options.appliesToDistanceIds
    }));
  };

  if (facts.eventDate?.value) add('date', 'Race date', formatDateForCopy(facts.eventDate.value), { sourcePath: 'event.date' });
  if (facts.distances.length) {
    add('distance', facts.distances.length === 1 ? 'Distance' : 'Distances', facts.distances.map((distance) => `${distance.name} (${distance.distance})`).join(', '), { sourcePath: 'distances', appliesToDistanceIds: distanceIds });
  }
  if (facts.startTime?.value) add('start-time', 'Start time', facts.startTime.value, { sourcePath: 'distances[].start_time', appliesToDistanceIds: distanceIds });
  if (facts.location?.value) {
    const detail = facts.sourceSections?.about?.value?.match(/starts and finishes[^.]+\./i)?.[0];
    add('location', 'Location', facts.location.value, { detail, sourcePath: 'event.location' });
  }
  if (facts.price?.value) add('price', 'Current listed price', facts.price.value, { sourcePath: 'distances[].price', appliesToDistanceIds: distanceIds });

  const packetSchedule = facts.scheduleItems.find((item) => /packet/i.test(item.name));
  const packetFaq = facts.faqs.find((faq) => /packet/i.test(faq.question));
  if (packetSchedule) {
    add('packet-pickup', 'Packet pick-up', [packetSchedule.day, packetSchedule.time, packetSchedule.location].filter(Boolean).join(' · '), { sourcePath: 'schedule', appliesToDistanceIds: distanceIds });
  } else if (packetFaq) {
    add('packet-pickup', 'Packet pick-up', packetFaq.answer, { sourcePath: 'faqs', appliesToDistanceIds: distanceIds });
  }

  if (facts.courseProfile?.value || facts.certification?.value) {
    add('course', 'Course notes', [facts.courseProfile?.value, facts.certification?.value].filter(Boolean).join(' · '), { sourcePath: 'distances[].profile', appliesToDistanceIds: distanceIds });
  }
  if (facts.aidStations?.value) add('aid-stations', 'Aid stations', `${facts.aidStations.value} crewed aid stations listed`, { sourcePath: 'distances[].aid_stations', appliesToDistanceIds: distanceIds });

  facts.faqs.forEach((faq) => {
    const combined = `${faq.question} ${faq.answer}`;
    if (/refund|transfer/i.test(combined)) add('refunds-transfers', 'Refunds/transfers', faq.answer, { sourcePath: 'faqs' });
    else if (/participants receive|shirt|swag|medal/i.test(combined)) add('swag', 'Shirt / medal', faq.answer, { sourcePath: 'faqs' });
    else if (/time limit|course is open/i.test(combined)) add('time-limit', 'Time limit', faq.answer, { sourcePath: 'faqs', appliesToDistanceIds: distanceIds });
    else if (/awards|prize/i.test(combined)) add('awards', 'Awards', faq.answer, { sourcePath: 'faqs' });
  });

  if (!items.length) return undefined;
  return {
    headline: 'Before you register',
    intro: 'A quick checklist of race details to review before you continue to official registration.',
    items
  };
}

function buildPrivateMockupProvenance(facts, metaInfo, rendered) {
  return {
    source_url: metaInfo.sourceUrl,
    captured_at: metaInfo.capturedAt,
    source_confirmed_sections: [
      ...(rendered.hasSchedule ? ['schedule'] : []),
      ...(facts.faqs.length ? ['faqs'] : []),
      ...(rendered.hasRunnerDecisionChecklist ? ['runner_decision_checklist'] : [])
    ],
    source_confirmed_distance_ids: facts.distances.map((distance) => distance.id),
    items: collectProvenance(facts)
  };
}

function collectProvenance(facts) {
  const items = [];
  const add = (pathName, item) => {
    if (item?.source) items.push({ path: pathName, source: item.source, confidence: item.confidence });
  };
  add('identity.name', facts.name);
  add('event.date', facts.eventDate);
  add('event.location', facts.location);
  add('seo.meta_description', facts.description);
  add('story.paragraphs', facts.description);
  add('story.paragraphs', facts.sourceSections?.registration);
  add('story.paragraphs', facts.sourceSections?.course);
  add('story.paragraphs', facts.sourceSections?.aid_stations_fluids);
  add('registration.url', facts.registrationUrl);
  add('distances[].start_time', facts.startTime);
  add('distances[].price', facts.price);
  add('distances[].certification', facts.certification);
  add('distances[].aid_stations', facts.aidStations);
  add('distances[].profile', facts.courseProfile);
  add('runner_decision_checklist.items.date', facts.eventDate);
  add('runner_decision_checklist.items.distance', facts.distances[0]?.provenance);
  add('runner_decision_checklist.items.start-time', facts.startTime);
  add('runner_decision_checklist.items.location', facts.location);
  add('runner_decision_checklist.items.price', facts.price);
  add('runner_decision_checklist.items.course', facts.courseProfile || facts.certification);
  add('runner_decision_checklist.items.aid-stations', facts.aidStations);
  add('runner_decision_checklist.items.packet-pickup', facts.sourceSections?.packet_pick_up);
  facts.faqs.forEach((faq) => {
    if (/refund|transfer/i.test(`${faq.question} ${faq.answer}`)) add('runner_decision_checklist.items.refunds-transfers', faq.provenance);
    if (/participants receive|shirt|swag|medal/i.test(`${faq.question} ${faq.answer}`)) add('runner_decision_checklist.items.swag', faq.provenance);
    if (/time limit|course is open/i.test(`${faq.question} ${faq.answer}`)) add('runner_decision_checklist.items.time-limit', faq.provenance);
    if (/awards|prize/i.test(`${faq.question} ${faq.answer}`)) add('runner_decision_checklist.items.awards', faq.provenance);
  });
  facts.distances.forEach((distance, index) => add(`distances[${index}]`, distance.provenance));
  facts.scheduleItems.forEach((item, index) => add(`schedule[${index}]`, item.provenance));
  facts.faqs.forEach((item, index) => add(`faqs[${index}]`, item.provenance));
  facts.images.forEach((image, index) => add(`private_mockup.assets[${index}]`, image));
  return items;
}

function summarizeConfidence(facts) {
  const values = collectProvenance(facts).map((item) => item.confidence);
  return {
    high: values.filter((value) => value === 'high').length,
    medium: values.filter((value) => value === 'medium').length,
    low: values.filter((value) => value === 'low').length
  };
}

function extractJsonLd(html) {
  return Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.['@graph'])) return parsed['@graph'];
      return [parsed];
    } catch {
      return [];
    }
  });
}

function meta(html, attr, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escaped}["'][^>]*>`, 'i');
  const match = html.match(re);
  return match?.[1] || match?.[2] || '';
}

function tagText(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
  return match ? htmlToText(match[1]) : '';
}

function htmlToText(value) {
  return decode(String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function decode(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .trim();
}

function cleanTitle(title) {
  return decode(String(title).split(/ [|–-] /)[0]).trim();
}

function safeResolve(src, baseUrl) {
  try {
    const resolved = new URL(src, baseUrl);
    if (!/^https?:$/.test(resolved.protocol)) return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

async function captureImages(urls, assetNamespace) {
  const assets = [];
  const assetDir = path.join(root, 'public/mockups', assetNamespace);
  await mkdir(assetDir, { recursive: true });

  for (const url of unique(urls)) {
    if (assets.length >= 2) break;
    if (!/\.(jpe?g|png|webp)(\?|#|$)/i.test(url)) continue;
    try {
      const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'image/avif,image/webp,image/png,image/jpeg,*/*' } });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (!/^image\/(jpeg|png|webp)/i.test(contentType)) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 6000 || bytes.length > 5_000_000) continue;
      const ext = extensionFor(contentType, url);
      const name = `${assets.length + 1}-${createHash('sha1').update(url).digest('hex').slice(0, 10)}.${ext}`;
      await writeFile(path.join(assetDir, name), bytes);
      assets.push(buildCapturedImageAsset({ assetNamespace, name, sourceUrl: url, index: assets.length }));
    } catch {
      // Keep generation resilient; missing/blocked images are recorded as an uncertainty.
    }
  }
  return assets;
}

function extensionFor(contentType, url) {
  if (/webp/i.test(contentType)) return 'webp';
  if (/png/i.test(contentType)) return 'png';
  const match = new URL(url).pathname.match(/\.([a-z0-9]+)$/i);
  return match && /jpe?g/i.test(match[1]) ? match[1].toLowerCase() : 'jpg';
}

function buildCapturedImageAsset({ assetNamespace, name, sourceUrl, index }) {
  return {
    src: `/mockups/${assetNamespace}/${name}`,
    alt: 'Public race-site image captured for concept direction',
    caption: index === 0 ? 'Public race-site image used for concept direction.' : 'Additional public race-site visual reference.',
    source: sourceUrl
  };
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeLocation(location) {
  if (typeof location === 'string') return location;
  const address = location?.address;
  if (typeof address === 'string') return address;
  return [address?.addressLocality, address?.addressRegion].filter(Boolean).join(', ') || '';
}

function formatDateForCopy(value) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatTime(value) {
  const match = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return value;
  return `${Number(match[1])}:${match[2] || '00'} ${match[3].toUpperCase()}`;
}

function sanitizeSlug(value) {
  return String(value || 'race-preview').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'race-preview';
}

function generateAccessToken() {
  return randomBytes(16).toString('hex');
}

function isValidAccessToken(value) {
  return /^[a-f0-9]{32,}$/i.test(String(value || ''));
}

function sourceHost(url) {
  return new URL(url).hostname.replace(/^www\./, '');
}

function fact(value, source, confidence, raw) {
  return { value, source, confidence, ...(raw ? { raw } : {}) };
}

function unique(values) {
  return [...new Set(values)];
}

function uniqueFacts(values) {
  const seen = new Set();
  return values.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

function removeUndefined(value) {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, removeUndefined(item)]));
  }
  return value;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncate(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function looksTruncated(value) {
  return /(?:…|\.\.\.)\s*$/.test(String(value || '').trim());
}

function cleanSentence(value, max) {
  const text = normalizeDisplayCopy(value);
  if (text.length <= max) return text;
  const clipped = text.slice(0, max + 1);
  const sentenceEnd = Math.max(clipped.lastIndexOf('.'), clipped.lastIndexOf('!'), clipped.lastIndexOf('?'));
  if (sentenceEnd >= Math.floor(max * 0.55)) return normalizeDisplayCopy(clipped.slice(0, sentenceEnd + 1));
  const comma = clipped.lastIndexOf(',');
  const space = clipped.lastIndexOf(' ');
  const cut = Math.max(comma, space);
  return normalizeDisplayCopy(clipped.slice(0, cut > 0 ? cut : max));
}

function normalizeDisplayCopy(value) {
  let text = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\blisted\s+by\s+the\s+source\s+page\b/gi, 'listed')
    .replace(/\bnoted\s+by\s+the\s+source\s+page\b/gi, 'noted')
    .replace(/\bfrom\s+the\s+race\s+source\b/gi, 'for this race')
    .replace(/\bfrom\s+the\s+source\s+config\b/gi, 'for race day')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)(?:st|nd|rd|th),\s+(20\d{2})\b/gi, '$1 $2, $3')
    .replace(/\b(\d+(?:st|nd|rd|th)?)(?:\s*)[-–—]\s*\$/gi, '$1 — $')
    .replace(/\s+[-–—]\s*\$/g, ' — $')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  text = text.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
  return text.replace(/\s+/g, ' ').trim();
}

function titleCase(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function formatTimeLabel(value) {
  return String(value || '').replace(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi, (_, hour, minute = '00', period) => `${Number(hour)}:${minute} ${period.toUpperCase()}`);
}

export { buildCapturedImageAsset, buildRunnerDecisionChecklist, extractStructuredLinks, labelForResourceUrl, normalizeDisplayCopy };
