package it.partecipa;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Absolute URLs on purpose: they show the real public paths, context path included. */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
class OperationsIT {

  @Autowired RestTestClient http;
  @LocalServerPort int port;

  private String url(String path) {
    return "http://localhost:" + port + path;
  }

  @Test
  void health_probes_are_public_under_the_versioned_path() {
    for (var path : new String[] {"/api/v1/actuator/health", "/api/v1/actuator/health/readiness"}) {
      http.get()
          .uri(url(path))
          .exchange()
          .expectStatus()
          .isOk()
          .expectBody()
          .jsonPath("$.status")
          .isEqualTo("UP")
          .jsonPath("$.components")
          .doesNotExist();
    }
  }

  @Test
  void nothing_answers_outside_the_versioned_path() {
    http.get().uri(url("/actuator/health")).exchange().expectStatus().isNotFound();
  }

  @Test
  void every_other_path_needs_a_token() {
    http.get().uri(url("/api/v1/anything")).exchange().expectStatus().isUnauthorized();
  }

  @Test
  void the_api_documentation_is_off_outside_the_dev_profile() {
    http.get().uri(url("/api/v1/docs")).exchange().expectStatus().isNotFound();
  }
}
