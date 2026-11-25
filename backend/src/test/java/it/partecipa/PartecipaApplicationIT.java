package it.partecipa;

import static org.assertj.core.api.Assertions.assertThat;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class PartecipaApplicationIT {

  @Autowired Flyway flyway;

  @Test
  void starts_on_postgresql_with_every_migration_applied() {
    assertThat(flyway.info().pending()).isEmpty();
  }
}
