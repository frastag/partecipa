-- Runs once, when the volume is empty. Dev-only passwords.
-- Two databases with separate owners: the app never reads Keycloak's data.
CREATE USER partecipa WITH PASSWORD 'partecipa';
CREATE DATABASE partecipa OWNER partecipa;

CREATE USER keycloak WITH PASSWORD 'keycloak';
CREATE DATABASE keycloak OWNER keycloak;
