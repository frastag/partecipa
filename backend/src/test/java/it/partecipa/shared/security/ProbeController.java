package it.partecipa.shared.security;

import it.partecipa.shared.web.ErrorCode;
import it.partecipa.shared.web.PartecipaException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Test-only endpoints that exercise the security and error configuration. */
@RestController
class ProbeController {

  enum ProbeError implements ErrorCode {
    PROBE_CLOSED;

    @Override
    public HttpStatus status() {
      return HttpStatus.CONFLICT;
    }
  }

  record ProbeRequest(@NotBlank @Size(max = 10) String name) {}

  @GetMapping("/probe")
  Map<String, String> whoAmI(@AuthenticationPrincipal Jwt jwt) {
    return Map.of("sub", jwt.getSubject());
  }

  @GetMapping("/probe/admin")
  @PreAuthorize("hasRole('admin')")
  Map<String, String> adminOnly() {
    return Map.of("ok", "admin");
  }

  @PostMapping("/probe")
  Map<String, String> write(@Valid @RequestBody ProbeRequest request) {
    return Map.of("name", request.name());
  }

  @GetMapping("/probe/closed")
  Map<String, String> closed() {
    throw new PartecipaException(ProbeError.PROBE_CLOSED);
  }
}
