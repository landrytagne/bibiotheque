package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.dto.ReservationRequestDto;
import com.ibizabroker.bibliotheque.dto.ReservationResponseDto;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.StatutReservation;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.ChampManquantException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import com.ibizabroker.bibliotheque.exceptions.RegleGestionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private static final int DUREE_RESERVATION_JOURS = 7;
    private static final int MAX_RESERVATIONS_ACTIVES = 3;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private BooksRepository booksRepository;

    @Autowired
    private UsersRepository usersRepository;

    public ReservationResponseDto creer(ReservationRequestDto requete) {
        List<String> champsManquants = new ArrayList<>();
        if (requete.getLivreId() == null) {
            champsManquants.add("livreId");
        }
        if (requete.getAdherentId() == null) {
            champsManquants.add("adherentId");
        }
        if (!champsManquants.isEmpty()) {
            throw new ChampManquantException("Champ(s) manquant(s) : " + String.join(", ", champsManquants));
        }

        Books livre = booksRepository.findById(requete.getLivreId())
                .orElseThrow(() -> new NotFoundException("Livre avec l'id " + requete.getLivreId() + " introuvable."));
        Users adherent = usersRepository.findById(requete.getAdherentId())
                .orElseThrow(() -> new NotFoundException("Adhérent avec l'id " + requete.getAdherentId() + " introuvable."));

        if (livre.getNoOfCopies() >= 1) {
            throw new RegleGestionException("RG-01 : le livre \"" + livre.getBookName()
                    + "\" est disponible ; seuls les livres indisponibles peuvent être réservés.");
        }
        if (reservationRepository.existsByAdherentUserIdAndLivreBookIdAndStatutIn(
                adherent.getUserId(), livre.getBookId(), StatutReservation.STATUTS_ACTIFS)) {
            throw new RegleGestionException("RG-02 : l'adhérent a déjà une réservation active sur ce livre.");
        }
        if (reservationRepository.countByAdherentUserIdAndStatutIn(
                adherent.getUserId(), StatutReservation.STATUTS_ACTIFS) >= MAX_RESERVATIONS_ACTIVES) {
            throw new RegleGestionException("RG-03 : l'adhérent a déjà " + MAX_RESERVATIONS_ACTIVES
                    + " réservations actives simultanées (maximum atteint).");
        }

        Date dateReservation = new Date();
        Calendar calendrier = Calendar.getInstance();
        calendrier.setTime(dateReservation);
        calendrier.add(Calendar.DATE, DUREE_RESERVATION_JOURS);

        Reservation reservation = new Reservation();
        reservation.setLivre(livre);
        reservation.setAdherent(adherent);
        reservation.setDateReservation(dateReservation);
        reservation.setDateExpiration(calendrier.getTime());
        reservation.setStatut(StatutReservation.EN_ATTENTE);

        return versDto(reservationRepository.save(reservation));
    }

    public List<ReservationResponseDto> lister(StatutReservation statut, Integer adherentId) {
        List<Reservation> reservations;
        if (statut != null && adherentId != null) {
            reservations = reservationRepository.findByAdherentUserIdAndStatut(adherentId, statut);
        } else if (statut != null) {
            reservations = reservationRepository.findByStatut(statut);
        } else if (adherentId != null) {
            reservations = reservationRepository.findByAdherentUserId(adherentId);
        } else {
            reservations = reservationRepository.findAll();
        }
        return reservations.stream().map(this::versDto).collect(Collectors.toList());
    }

    public ReservationResponseDto consulter(Integer id) {
        return versDto(trouverOuLever(id));
    }

    public ReservationResponseDto annuler(Integer id) {
        Reservation reservation = trouverOuLever(id);

        if (reservation.getStatut() == StatutReservation.ANNULEE) {
            throw new RegleGestionException("RG-06 : la réservation est déjà annulée et ne peut plus changer d'état.");
        }
        if (!reservation.getStatut().estActif()) {
            throw new RegleGestionException("RG-05 : seule une réservation EN_ATTENTE ou DISPONIBLE peut être annulée. "
                    + "RG-06 : l'état " + reservation.getStatut() + " est terminal.");
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        return versDto(reservationRepository.save(reservation));
    }

    public void supprimer(Integer id) {
        Reservation reservation = trouverOuLever(id);
        reservationRepository.delete(reservation);
    }

    private Reservation trouverOuLever(Integer id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Réservation avec l'id " + id + " introuvable."));
    }

    private ReservationResponseDto versDto(Reservation reservation) {
        ReservationResponseDto dto = new ReservationResponseDto();
        dto.setId(reservation.getReservationId());
        dto.setLivreId(reservation.getLivre().getBookId());
        dto.setLivreNom(reservation.getLivre().getBookName());
        dto.setAdherentId(reservation.getAdherent().getUserId());
        dto.setAdherentNom(reservation.getAdherent().getName());
        dto.setDateReservation(reservation.getDateReservation());
        dto.setDateExpiration(reservation.getDateExpiration());
        dto.setStatut(reservation.getStatut());
        return dto;
    }
}
