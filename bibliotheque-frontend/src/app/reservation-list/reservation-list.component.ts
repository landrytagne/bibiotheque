import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Reservation } from '../_model/reservation';

@Component({
  selector: 'app-reservation-list',
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent implements OnInit {

  @Input() reservations: Reservation[] = [];
  @Input() chargement: boolean = false;
  @Input() erreur: string | null = null;
  @Input() statutSelectionne: string = 'TOUS';

  @Output() filtrer = new EventEmitter<string>();
  @Output() annuler = new EventEmitter<number>();
  @Output() reessayer = new EventEmitter<void>();

  statuts = ['TOUS', 'EN_ATTENTE', 'DISPONIBLE', 'ANNULEE', 'EXPIREE', 'HONOREE'];

  constructor() { }

  ngOnInit(): void {
  }

  changerStatut(statut: string) {
    this.filtrer.emit(statut);
  }

  demanderAnnulation(id: number) {
    this.annuler.emit(id);
  }

  boutonAnnulationVisible(r: Reservation): boolean {
    return (r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE');
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'DISPONIBLE': return 'status-available';
      case 'ANNULEE': return 'status-cancelled';
      case 'EXPIREE': return 'status-expired';
      case 'HONOREE': return 'status-honored';
      default: return '';
    }
  }
}
