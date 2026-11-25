package it.partecipa;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTest {

  @Test
  void modules_respect_their_boundaries_and_have_no_cycles() {
    ApplicationModules.of(PartecipaApplication.class).verify();
  }
}
