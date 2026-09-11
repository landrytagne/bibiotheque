package com.ibizabroker.bibliotheque.exceptions;

/**
 * L'identité ne peut pas être établie : token absent, illisible, expiré, ou
 * utilisateur du token disparu de la base. Traduite en 401 (et non 403) :
 * « je ne sais pas qui vous êtes », conformément à la distinction exigée
 * par le sujet (séance 4).
 */
public class AuthentificationRequiseException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public AuthentificationRequiseException(String message) {
        super(message);
    }
}
