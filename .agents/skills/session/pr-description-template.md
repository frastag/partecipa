<!-- First line only when the work has an issue: -->
Closes #<n>

## Description
<What problem this solves, in two or three sentences, for someone who has not followed the work.>

## What was done?
- <main change, with the feature package / folder it lives in>
- <docs and knowledge pages updated>

## Impact for users
<What people or organisations will notice. "None" for internal changes.>

## How it was verified
- Back end `./mvnw verify`: <N tests passed, coverage> · Front end `lint` / `test` / `build`: <result>
- Parity with the original (`parity-check`): <pages compared, remaining differences and why, or "not affected">
- Privacy (`privacy-check`): <result, or "no personal data touched">
- Browser: <pages and widths looked at>
- Not tested: <what, and why>

## Checklist
- [ ] Back-end and front-end quality gates pass
- [ ] New logic has tests; REST changes have a controller test and a front-end service test
- [ ] Pages compared with the original (`parity-check`)
- [ ] Personal data changes reviewed (`privacy-check`)
- [ ] Affected docs and `.agents/knowledge/` pages updated, "not built yet" markers accurate
- [ ] App texts in Italian and English as in the original; everything else in English
