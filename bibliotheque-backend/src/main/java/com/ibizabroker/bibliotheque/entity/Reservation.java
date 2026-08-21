package com.ibizabroker.bibliotheque.entity;

import lombok.Data;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "Reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer reservationId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "livre_id", nullable = false)
    private Books livre;

    @ManyToOne(optional = false)
    @JoinColumn(name = "adherent_id", nullable = false)
    private Users adherent;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateReservation;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateExpiration;

    @Enumerated(EnumType.STRING)
    private StatutReservation statut;
}
