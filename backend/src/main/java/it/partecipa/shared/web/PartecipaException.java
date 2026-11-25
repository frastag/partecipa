package it.partecipa.shared.web;

/** Base of every exception that becomes a {@code ProblemDetail} with a code. */
public class PartecipaException extends RuntimeException {

  private static final long serialVersionUID = 1L;

  private final transient ErrorCode code;

  public PartecipaException(ErrorCode code) {
    super(code.name());
    this.code = code;
  }

  public ErrorCode code() {
    return code;
  }
}
