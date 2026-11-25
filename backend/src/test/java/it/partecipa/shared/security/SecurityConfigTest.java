package it.partecipa.shared.security;

import static it.partecipa.shared.security.TestJwts.AUDIENCE;
import static it.partecipa.shared.security.TestJwts.ISSUER;
import static it.partecipa.shared.security.TestJwts.NOW;
import static it.partecipa.shared.security.TestJwts.token;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = ProbeController.class)
@Import({SecurityConfig.class, TestJwts.class})
class SecurityConfigTest {

  private static final Duration TEN_MINUTES = Duration.ofMinutes(10);

  @Autowired MockMvc mvc;

  @Test
  void a_request_without_a_token_is_rejected() throws Exception {
    mvc.perform(get("/probe")).andExpect(status().isUnauthorized());
  }

  @Test
  void a_valid_token_identifies_the_person_by_sub() throws Exception {
    mvc.perform(get("/probe").header("Authorization", "Bearer " + token("person-1")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sub").value("person-1"));
  }

  @Test
  void an_expired_token_is_rejected() throws Exception {
    var expired = token("person-1", ISSUER, List.of(AUDIENCE), NOW.minus(TEN_MINUTES));
    mvc.perform(get("/probe").header("Authorization", "Bearer " + expired))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void a_token_for_another_audience_is_rejected() throws Exception {
    var foreign = token("person-1", ISSUER, List.of("realm-management"), NOW);
    mvc.perform(get("/probe").header("Authorization", "Bearer " + foreign))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void a_token_from_another_issuer_is_rejected() throws Exception {
    var foreign = token("person-1", "http://elsewhere.test/realms/x", List.of(AUDIENCE), NOW);
    mvc.perform(get("/probe").header("Authorization", "Bearer " + foreign))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void a_tampered_token_is_rejected() throws Exception {
    var tampered = token("person-1") + "x";
    mvc.perform(get("/probe").header("Authorization", "Bearer " + tampered))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void admin_endpoints_need_the_admin_realm_role() throws Exception {
    mvc.perform(get("/probe/admin").header("Authorization", "Bearer " + token("person-1")))
        .andExpect(status().isForbidden());
    mvc.perform(get("/probe/admin").header("Authorization", "Bearer " + token("person-2", "admin")))
        .andExpect(status().isOk());
  }

  @Test
  void writes_need_no_csrf_token_and_create_no_session() throws Exception {
    mvc.perform(
            post("/probe")
                .header("Authorization", "Bearer " + token("person-1"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Laura\"}"))
        .andExpect(status().isOk())
        .andExpect(header().doesNotExist("Set-Cookie"));
  }

  @Test
  void validation_errors_come_back_as_field_codes() throws Exception {
    mvc.perform(
            post("/probe")
                .header("Authorization", "Bearer " + token("person-1"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.errors[0].field").value("name"))
        .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
  }

  @Test
  void a_partecipa_exception_becomes_a_problem_detail_with_its_code() throws Exception {
    mvc.perform(get("/probe/closed").header("Authorization", "Bearer " + token("person-1")))
        .andExpect(status().isConflict())
        .andExpect(header().string("Content-Type", "application/problem+json"))
        .andExpect(jsonPath("$.code").value("PROBE_CLOSED"));
  }

  @Test
  void responses_carry_the_security_headers() throws Exception {
    mvc.perform(get("/probe").header("Authorization", "Bearer " + token("person-1")))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
        .andExpect(header().string("X-Frame-Options", "DENY"))
        .andExpect(header().string("Referrer-Policy", "same-origin"))
        .andExpect(
            header().string("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate"));
  }
}
