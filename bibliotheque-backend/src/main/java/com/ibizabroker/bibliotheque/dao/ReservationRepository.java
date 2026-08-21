package com.ibizabroker.bibliotheque.dao;

import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findByStatut(StatutReservation statut);

    List<Reservation> findByAdherentUserId(Integer adherentId);

    List<Reservation> findByAdherentUserIdAndStatut(Integer adherentId, StatutReservation statut);

    boolean existsByAdherentUserIdAndLivreBookIdAndStatutIn(Integer adherentId, Integer livreId,
                                                            Collection<StatutReservation> statuts);

    long countByAdherentUserIdAndStatutIn(Integer adherentId, Collection<StatutReservation> statuts);
}
