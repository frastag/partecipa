package it.partecipa.shared.web;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Errors as RFC 9457 problem details with a code; never with text for people. */
@RestControllerAdvice
class ProblemDetailsAdvice {

  static final String VALIDATION_FAILED = "VALIDATION_FAILED";

  @ExceptionHandler(PartecipaException.class)
  ProblemDetail handle(PartecipaException e) {
    var problem = ProblemDetail.forStatus(e.code().status());
    problem.setProperty("code", e.code().name());
    return problem;
  }

  /** Field codes are the constraint names ({@code NotBlank}, {@code Size}). */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail handle(MethodArgumentNotValidException e) {
    var problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    problem.setProperty("code", VALIDATION_FAILED);
    List<Map<String, String>> errors =
        e.getBindingResult().getFieldErrors().stream()
            .map(ProblemDetailsAdvice::fieldError)
            .toList();
    problem.setProperty("errors", errors);
    return problem;
  }

  private static Map<String, String> fieldError(FieldError error) {
    return Map.of(
        "field", error.getField(), "code", error.getCode() == null ? "Invalid" : error.getCode());
  }
}
