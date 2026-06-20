# race-templates

Template library and governance docs for race director website archetypes.

## Starter/Standard ops

Credential-free delivery tooling is documented in [`docs/STARTER_STANDARD_OPS.md`](docs/STARTER_STANDARD_OPS.md).

Common commands:

```bash
npm run validate:config
npm run build
npm run launch:check -- src/data/samples/hartwell-half.json
npm run scaffold:customer -- river-city-half community
```

Community is the first Standard fulfillment path intended for customer-ready use. It renders from JSON config, uses the configured registration URL for CTAs, emits register-click analytics attributes/listener, and includes SportsEvent JSON-LD on the Community preview/customer scaffold path.
