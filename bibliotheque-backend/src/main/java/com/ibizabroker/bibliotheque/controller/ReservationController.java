package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dto.ReservationRequestDto;
import com.ibizabroker.bibliotheque.dto.ReservationResponseDto;
import com.ibizabroker.bibliotheque.entity.StatutReservation;
import com.ibizabroker.bibliotheque.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/reservations")
@Tag(name = "Réservations", description = "Gestion des réservations de livres indisponibles")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @Operation(summary = "Créer une réservation",
            description = "Réserve un livre pour un adhérent. Le client n'envoie que livreId et adherentId ; "
                    + "dateReservation, dateExpiration et statut sont déterminés par le serveur.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Réservation créée"),
            @ApiResponse(responseCode = "400", description = "livreId ou adherentId manquant"),
            @ApiResponse(responseCode = "404", description = "Livre ou adhérent inconnu"),
            @ApiResponse(responseCode = "409", description = "Règle de gestion violée (RG-01, RG-02, RG-03)")
    })
    @PostMapping
    public ResponseEntity<ReservationResponseDto> creer(@RequestBody ReservationRequestDto requete) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.creer(requete));
    }

    @Operation(summary = "Lister les réservations",
            description = "Filtrable par statut et/ou par adhérent.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des réservations")
    })
    @GetMapping
    public List<ReservationResponseDto> lister(
            @Parameter(description = "Filtrer par statut") @RequestParam(required = false) StatutReservation statut,
            @Parameter(description = "Filtrer par identifiant d'adhérent") @RequestParam(required = false) Integer adherentId) {
        return reservationService.lister(statut, adherentId);
    }

    @Operation(summary = "Consulter une réservation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Réservation trouvée"),
            @ApiResponse(responseCode = "404", description = "Réservation inconnue")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponseDto> consulter(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.consulter(id));
    }

    @Operation(summary = "Annuler une réservation",
            description = "Possible uniquement si le statut est EN_ATTENTE ou DISPONIBLE (RG-05, RG-06).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Réservation annulée"),
            @ApiResponse(responseCode = "404", description = "Réservation inconnue"),
            @ApiResponse(responseCode = "409", description = "Annulation interdite (RG-05, RG-06)")
    })
    @PatchMapping("/{id}/annuler")
    public ResponseEntity<ReservationResponseDto> annuler(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.annuler(id));
    }

    @Operation(summary = "Supprimer une réservation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Réservation supprimée"),
            @ApiResponse(responseCode = "404", description = "Réservation inconnue")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Integer id) {
        reservationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
