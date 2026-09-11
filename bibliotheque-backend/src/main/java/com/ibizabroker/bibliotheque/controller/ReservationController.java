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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/reservations")
@Tag(name = "Réservations", description = "Gestion des réservations de livres indisponibles")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @Operation(summary = "Créer une réservation",
            description = "Réserve un livre. Un ADHERENT réserve pour lui-même : l'identité vient du token, "
                    + "l'adherentId éventuellement envoyé est ignoré (RS-04). Un BIBLIOTHECAIRE réserve pour "
                    + "n'importe quel adhérent en renseignant adherentId. "
                    + "dateReservation, dateExpiration et statut sont déterminés par le serveur.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Réservation créée"),
            @ApiResponse(responseCode = "400", description = "livreId manquant (ou adherentId manquant pour un bibliothécaire)"),
            @ApiResponse(responseCode = "404", description = "Livre ou adhérent inconnu"),
            @ApiResponse(responseCode = "409", description = "Règle de gestion violée (RG-01, RG-02, RG-03)")
    })
    @PostMapping
    public ResponseEntity<ReservationResponseDto> creer(
            @RequestBody ReservationRequestDto requete,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservationService.creer(requete));
    }

    @Operation(summary = "Lister les réservations",
            description = "Un ADHERENT reçoit ses réservations seulement (RS-05) ; un BIBLIOTHECAIRE reçoit toutes, "
                    + "filtrables par statut et/ou par adhérent.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des réservations")
    })
    @GetMapping
    public List<ReservationResponseDto> lister(
            @Parameter(description = "Filtrer par statut") @RequestParam(required = false) StatutReservation statut,
            @Parameter(description = "Filtrer par identifiant d'adhérent (bibliothécaire seulement)")
            @RequestParam(required = false) Integer adherentId,
            Authentication authentication) {
        return reservationService.lister(statut, adherentId, authentication.getName());
    }

    @Operation(summary = "Consulter une réservation",
            description = "Un ADHERENT ne consulte que ses propres réservations (RS-03) ; un BIBLIOTHECAIRE toutes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Réservation trouvée"),
            @ApiResponse(responseCode = "403", description = "Réservation d'un autre adhérent"),
            @ApiResponse(responseCode = "404", description = "Réservation inconnue")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponseDto> consulter(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(reservationService.consulter(id, authentication.getName()));
    }

    @Operation(summary = "Annuler une réservation",
            description = "Possible uniquement si le statut est EN_ATTENTE ou DISPONIBLE (RG-05, RG-06). "
                    + "Un ADHERENT n'annule que ses propres réservations (RS-03) ; un BIBLIOTHECAIRE toutes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Réservation annulée"),
            @ApiResponse(responseCode = "403", description = "Réservation d'un autre adhérent"),
            @ApiResponse(responseCode = "404", description = "Réservation inconnue"),
            @ApiResponse(responseCode = "409", description = "Annulation interdite (RG-05, RG-06)")
    })
    @PatchMapping("/{id}/annuler")
    public ResponseEntity<ReservationResponseDto> annuler(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(reservationService.annuler(id, authentication.getName()));
    }

    @Operation(summary = "Supprimer une réservation",
            description = "Réservé au BIBLIOTHECAIRE (rôle Admin). Un ADHERENT reçoit 403 (RS-02).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Réservation supprimée"),
            @ApiResponse(responseCode = "403", description = "Accès réservé au bibliothécaire"),
            @ApiResponse(responseCode = "404", description = "Réservation inconnue")
    })
    @PreAuthorize("hasRole('Admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Integer id) {
        reservationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
