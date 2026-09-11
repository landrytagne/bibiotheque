import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Reservation } from '../_model/reservation';

@Component({
  selector: 'app-reservation-list',
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent {
  @Input() reservations: Reservation[] = [];
  @Input() chargement = false;
  @Input() erreur: string | null = null;
  @Input() statutSelectionne = 'TOUS';
  @Output() filtrer = new EventEmitter<string>();
  @Output() annuler = new EventEmitter<number>();
  @Output() reessayer = new EventEmitter<void>();

  statuts = ['TOUS', 'EN_ATTENTE', 'DISPONIBLE', 'ANNULÉE', 'EXPIRÉE', 'HONORÉE'];

  changerStatut(statut: string): void {
    this.statutSelectionne = statut;
    this.filtrer.emit(statut);
  }

  demanderAnnulation(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.annuler.emit(id);
    }
  }

  boutonAnnulationVisible(reservation: Reservation): boolean {
    return reservation.statut === 'EN_ATTENTE' || reservation.statut === 'DISPONIBLE';
  }
}
