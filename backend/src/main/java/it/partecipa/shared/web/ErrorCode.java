package it.partecipa.shared.web;

import org.springframework.http.HttpStatus;

/**
 * A failure the person should understand. Each module declares its codes in an enum that implements
 * this; the front end owns the text for each code.
 */
public interface ErrorCode {

  /** The code sent in the {@code ProblemDetail}, e.g. {@code ALREADY_SIGNED}. */
  String name();

  HttpStatus status();
}
