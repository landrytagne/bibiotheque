package com.ibizabroker.bibliotheque.entity;

import java.util.Arrays;
import java.util.List;

public enum StatutReservation {

    EN_ATTENTE,
    DISPONIBLE,
    ANNULEE,
    EXPIREE,
    HONOREE;

    public static final List<StatutReservation> STATUTS_ACTIFS = Arrays.asList(EN_ATTENTE, DISPONIBLE);

    public boolean estActif() {
        return this == EN_ATTENTE || this == DISPONIBLE;
    }
}
