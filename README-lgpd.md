# LGPD Consent and Legal Basis

This document summarizes the legal bases used for collecting and processing personal data within the project.

## Legal Bases

- **Analytics**: Consent of the data subject (art. 7, I).
- **Marketing**: Consent of the data subject (art. 7, I).
- **Data Sharing**: Legitimate interest or specific consent depending on partner (art. 7, IX).

## Retention

The `lgpd_consent` table stores the retention period in days for each user. An automated job removes or anonymizes data once the period expires.

## Reversibility & Auditability

Users may change their consent at any time. All changes are recorded in `lgpd_consent_history` for audit purposes.

## Logs

Application logs are minimized and avoid storing personally identifiable information.
