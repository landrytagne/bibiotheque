package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.dto.ReservationRequestDto;
import com.ibizabroker.bibliotheque.dto.ReservationResponseDto;
import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.Role;
import com.ibizabroker.bibliotheque.entity.StatutReservation;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.RegleGestionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test unitaire de la règle RG-03 : maximum 3 réservations actives
 * simultanées par adhérent. Le repository est simulé (mock) : le test
 * s'exécute sans aucune base de données.
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceRg03Test {

    private static final Integer LIVRE_ID = 10;
    private static final Integer ADHERENT_ID = 7;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private BooksRepository booksRepository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private SecurityService securityService;

    @InjectMocks
    private ReservationService reservationService;

    @Captor
    private ArgumentCaptor<Reservation> reservationCaptor;

    private Books livreIndisponible;

    @BeforeEach
    void preparer() {
        livreIndisponible = new Books();
        livreIndisponible.setBookId(LIVRE_ID);
        livreIndisponible.setBookName("Livre indisponible");
        livreIndisponible.setNoOfCopies(0);

        Role roleAdherent = new Role();
        roleAdherent.setRoleName("User");
        Users adherent = new Users();
        adherent.setUserId(ADHERENT_ID);
        adherent.setUsername("adherent1");
        adherent.setRole(new HashSet<>(Collections.singletonList(roleAdherent)));

        lenient().when(booksRepository.findById(LIVRE_ID)).thenReturn(Optional.of(livreIndisponible));
        lenient().when(securityService.adherentAutorise(ADHERENT_ID)).thenReturn(adherent);
    }

    @Test
    @DisplayName("RG-03 : un adhérent ayant 2 réservations actives peut en créer une troisième")
    void creer_avecDeuxReservationsActives_creeLaTroisieme() {
        when(reservationRepository.existsByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(ADHERENT_ID), eq(LIVRE_ID), any())).thenReturn(false);
        when(reservationRepository.countByAdherentUserIdAndStatutIn(
                eq(ADHERENT_ID), any())).thenReturn(2L);
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReservationRequestDto requete = new ReservationRequestDto();
        requete.setLivreId(LIVRE_ID);
        requete.setAdherentId(ADHERENT_ID);

        ReservationResponseDto reponse = reservationService.creer(requete);

        assertThat(reponse.getStatut()).isEqualTo(StatutReservation.EN_ATTENTE);
        assertThat(reponse.getAdherentId()).isEqualTo(ADHERENT_ID);
        verify(reservationRepository).save(reservationCaptor.capture());
        assertThat(reservationCaptor.getValue().getAdherent().getUserId()).isEqualTo(ADHERENT_ID);
    }

    @Test
    @DisplayName("RG-03 : un adhérent ayant 3 réservations actives reçoit un refus")
    void creer_avecTroisReservationsActives_leveUnRefus() {
        when(reservationRepository.existsByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(ADHERENT_ID), eq(LIVRE_ID), any())).thenReturn(false);
        when(reservationRepository.countByAdherentUserIdAndStatutIn(
                eq(ADHERENT_ID), any())).thenReturn(3L);

        ReservationRequestDto requete = new ReservationRequestDto();
        requete.setLivreId(LIVRE_ID);
        requete.setAdherentId(ADHERENT_ID);

        assertThatThrownBy(() -> reservationService.creer(requete))
                .isInstanceOf(RegleGestionException.class)
                .hasMessageContaining("RG-03");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }
}
