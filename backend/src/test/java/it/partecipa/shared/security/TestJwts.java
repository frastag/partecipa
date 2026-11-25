package it.partecipa.shared.security;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/**
 * Signs access tokens like Keycloak does, with a key generated for the test run. The decoder uses
 * the production validator, so issuer, audience and expiry are checked for real.
 */
@TestConfiguration(proxyBeanMethods = false)
@EnableConfigurationProperties(ApiSecurityProperties.class)
public class TestJwts {

  public static final String ISSUER = "http://issuer.test/realms/partecipa";
  public static final String AUDIENCE = "partecipa-api";
  private static final int KEY_SIZE = 2048;
  private static final Duration LIFESPAN = Duration.ofMinutes(5);
  private static final KeyPair KEYS = generateKeys();

  /** The tests' "now": tokens are issued at this instant and checked against it. */
  public static final Instant NOW = Instant.parse("2026-11-25T12:00:00Z");

  @Bean
  Clock clock() {
    return Clock.fixed(NOW, ZoneOffset.UTC);
  }

  @Bean
  @Primary
  JwtDecoder testJwtDecoder(
      @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer,
      ApiSecurityProperties properties,
      Clock clock) {
    var decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) KEYS.getPublic()).build();
    decoder.setJwtValidator(JwtValidation.validator(issuer, properties.audience(), clock));
    return decoder;
  }

  /** A valid token for {@code subject} with the given realm roles. */
  public static String token(String subject, String... roles) {
    return token(subject, ISSUER, List.of(AUDIENCE, "account"), NOW, roles);
  }

  public static String token(
      String subject, String issuer, List<String> audience, Instant issuedAt, String... roles) {
    var claims =
        JwtClaimsSet.builder()
            .issuer(issuer)
            .subject(subject)
            .audience(audience)
            .issuedAt(issuedAt)
            .expiresAt(issuedAt.plus(LIFESPAN))
            .claim("realm_access", Map.of("roles", List.of(roles)))
            .build();
    var encoder =
        NimbusJwtEncoder.withKeyPair(
                (RSAPublicKey) KEYS.getPublic(), (RSAPrivateKey) KEYS.getPrivate())
            .build();
    return encoder
        .encode(JwtEncoderParameters.from(JwsHeader.with(SignatureAlgorithm.RS256).build(), claims))
        .getTokenValue();
  }

  private static KeyPair generateKeys() {
    try {
      var generator = KeyPairGenerator.getInstance("RSA");
      generator.initialize(KEY_SIZE);
      return generator.generateKeyPair();
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("RSA not available", e);
    }
  }
}
