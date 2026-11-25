/**
 * Cross-cutting infrastructure every module may use: security, web errors, time. It depends on no
 * feature module (docs/architecture.md, "Modules").
 */
@ApplicationModule(type = ApplicationModule.Type.OPEN)
package it.partecipa.shared;

import org.springframework.modulith.ApplicationModule;
