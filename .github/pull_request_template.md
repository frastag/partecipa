<!-- Link the issue, if any: "Closes #12" closes it when the PR is merged -->
Closes #

## Description
<!-- What problem does this solve, in a few sentences -->

## What was done?
<!-- Main changes -->

## Checklist
- [ ] Back end `./mvnw verify` and front end `npm run lint && npm test && npm run build` pass
- [ ] New logic has tests; REST changes have a controller test (with the forbidden case) and a front-end API test
- [ ] Pages looked at in a browser at 375 and 1280 px, in Italian and English
- [ ] Personal data, auth and Keycloak changes reviewed (`privacy-check`)
- [ ] Migrations compatible with the previous release; realm changes exported to `infra/keycloak/`
- [ ] Affected docs and `.agents/knowledge/` pages updated
- [ ] App texts in Italian and English; everything else in English
