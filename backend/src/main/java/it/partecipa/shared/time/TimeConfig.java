package it.partecipa.shared.time;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Code under test reads the time only from this clock (docs/code-style-java.md). */
@Configuration(proxyBeanMethods = false)
class TimeConfig {

  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
