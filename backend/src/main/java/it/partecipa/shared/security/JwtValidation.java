package it.partecipa.shared.security;

import java.time.Clock;
import java.util.List;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;

/** The checks every access token must pass, besides its signature. */
public final class JwtValidation {

  private JwtValidation() {}

  /** Expiry and not-before against {@code clock} (default skew), issuer, and our audience. */
  public static OAuth2TokenValidator<Jwt> validator(String issuer, String audience, Clock clock) {
    var timestamps = new JwtTimestampValidator();
    timestamps.setClock(clock);
    OAuth2TokenValidator<Jwt> hasAudience =
        new JwtClaimValidator<List<String>>(
            JwtClaimNames.AUD, aud -> aud != null && aud.contains(audience));
    return new DelegatingOAuth2TokenValidator<>(
        timestamps, new JwtIssuerValidator(issuer), hasAudience);
  }
}
