package it.partecipa.shared.security;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Settings of the API's token checks.
 *
 * @param audience the value every access token's {@code aud} must contain; Keycloak's audience
 *     mapper on the web client adds it (infra/keycloak/realm-partecipa.json)
 */
@Validated
@ConfigurationProperties("partecipa.security")
public record ApiSecurityProperties(@NotBlank String audience) {}
