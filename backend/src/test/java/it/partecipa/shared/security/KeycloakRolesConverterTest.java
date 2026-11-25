package it.partecipa.shared.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class KeycloakRolesConverterTest {

  private final KeycloakRolesConverter converter = new KeycloakRolesConverter();

  @Test
  void realm_roles_become_role_authorities() {
    var jwt = jwt(Map.of("realm_access", Map.of("roles", List.of("admin", "offline_access"))));

    assertThat(converter.convert(jwt))
        .extracting(GrantedAuthority::getAuthority)
        .containsExactly("ROLE_admin", "ROLE_offline_access");
  }

  @Test
  void a_token_without_realm_roles_has_no_authorities() {
    assertThat(converter.convert(jwt(Map.of("scope", "openid")))).isEmpty();
    assertThat(converter.convert(jwt(Map.of("realm_access", Map.of())))).isEmpty();
    assertThat(converter.convert(jwt(Map.of("realm_access", "not-an-object")))).isEmpty();
  }

  private static Jwt jwt(Map<String, Object> claims) {
    return Jwt.withTokenValue("token")
        .header("alg", "RS256")
        .subject("subject")
        .issuedAt(Instant.EPOCH)
        .claims(c -> c.putAll(claims))
        .build();
  }
}
