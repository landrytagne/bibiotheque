package com.ibizabroker.bibliotheque.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Collections;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ChampManquantException.class)
    public ResponseEntity<Map<String, String>> gererChampManquant(ChampManquantException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("message", ex.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> gererIntrouvable(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", ex.getMessage()));
    }

    @ExceptionHandler(RegleGestionException.class)
    public ResponseEntity<Map<String, String>> gererRegleGestion(RegleGestionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Collections.singletonMap("message", ex.getMessage()));
    }

    @ExceptionHandler(AccesRefuseException.class)
    public ResponseEntity<Map<String, String>> gererAccesRefuse(AccesRefuseException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Collections.singletonMap("message", ex.getMessage()));
    }

    /**
     * Refus levé par @PreAuthorize (method security) : 401 si l'appelant est
     * anonyme, 403 s'il est authentifié sans les droits requis.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> gererAccesInterdit(AccessDeniedException ex) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Authentification requise."));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Collections.singletonMap("message", ex.getMessage()));
    }
}
