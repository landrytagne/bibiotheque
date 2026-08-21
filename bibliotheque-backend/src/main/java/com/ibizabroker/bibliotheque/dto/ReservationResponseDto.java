package com.ibizabroker.bibliotheque.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ibizabroker.bibliotheque.entity.StatutReservation;
import lombok.Data;

import java.util.Date;

@Data
public class ReservationResponseDto {

    private Integer id;
    private Integer livreId;
    private String livreNom;
    private Integer adherentId;
    private String adherentNom;

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    private Date dateReservation;

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    private Date dateExpiration;

    private StatutReservation statut;
}
