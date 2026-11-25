package it.partecipa.shared.security;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/** Keycloak realm roles ({@code realm_access.roles}) as {@code ROLE_<role>} authorities. */
final class KeycloakRolesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

  @Override
  public Collection<GrantedAuthority> convert(Jwt jwt) {
    if (!(jwt.getClaims().get("realm_access") instanceof Map<?, ?> realmAccess)) {
      return List.of();
    }
    if (!(realmAccess.get("roles") instanceof Collection<?> roles)) {
      return List.of();
    }
    return roles.stream()
        .filter(String.class::isInstance)
        .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
        .toList();
  }
}
