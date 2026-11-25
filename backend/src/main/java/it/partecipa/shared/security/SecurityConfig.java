package it.partecipa.shared.security;

import jakarta.servlet.DispatcherType;
import java.time.Clock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.SupplierJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;

/**
 * The API is a stateless OAuth2 resource server: Keycloak access tokens only, no session, no
 * cookies, so no CSRF token (docs/privacy-and-security.md, "Tokens and the API").
 */
@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity
class SecurityConfig {

  /** Paths anyone may call. Every other path needs a valid token. */
  private static final String[] PUBLIC_GET_PATHS = {"/actuator/health/**", "/docs/**"};

  @Bean
  SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
    var jwtConverter = new JwtAuthenticationConverter();
    jwtConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRolesConverter());
    http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .csrf(AbstractHttpConfigurer::disable)
        .requestCache(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .authorizeHttpRequests(auth ->
            // Error pages render the status of a request that was already authorised or
            // rejected; without this an unknown path answers 401 instead of 404.
            auth.dispatcherTypeMatchers(DispatcherType.ERROR)
                .permitAll()
                .requestMatchers(HttpMethod.GET, PUBLIC_GET_PATHS)
                .permitAll()
                .anyRequest()
                .authenticated())
        .oauth2ResourceServer(o -> o.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter)))
        .headers(h -> h.referrerPolicy(r -> r.policy(ReferrerPolicy.SAME_ORIGIN)));
    return http.build();
  }

  /**
   * Keys come from the issuer's JWKS, fetched on the first request, so the API starts even while
   * Keycloak is still starting.
   */
  @Bean
  JwtDecoder jwtDecoder(
      @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer,
      ApiSecurityProperties properties,
      Clock clock) {
    return new SupplierJwtDecoder(() -> {
      var decoder = (NimbusJwtDecoder) JwtDecoders.fromIssuerLocation(issuer);
      decoder.setJwtValidator(JwtValidation.validator(issuer, properties.audience(), clock));
      return decoder;
    });
  }
}
