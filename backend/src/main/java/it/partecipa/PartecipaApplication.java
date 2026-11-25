package it.partecipa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PartecipaApplication {

  public static void main(String[] args) {
    SpringApplication.run(PartecipaApplication.class, args);
  }
}
