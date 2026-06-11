export function getGa4MeasurementId(config = {}) {
  return import.meta.env.PUBLIC_GA4_MEASUREMENT_ID || config.analytics?.ga4_measurement_id || '';
}

export function ga4Snippet(config = {}) {
  const measurementId = getGa4MeasurementId(config);
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') return '';

  return `
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;
}

export function registerClickAttributes(config = {}, placement = 'unknown') {
  const eventName = config.analytics?.register_click_event_name || 'register_click';
  return {
    'data-analytics-event': eventName,
    'data-analytics-placement': placement,
    'data-registration-platform': config.registration?.platform || 'unknown'
  };
}

export function registerClickListenerScript() {
  return `
<script>
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-analytics-event]');
    if (!target || typeof window.gtag !== 'function') return;
    window.gtag('event', target.dataset.analyticsEvent || 'register_click', {
      event_category: 'registration',
      event_label: target.dataset.analyticsPlacement || target.textContent.trim(),
      registration_platform: target.dataset.registrationPlatform || 'unknown',
      link_url: target.href || ''
    });
  });
</script>`;
}
