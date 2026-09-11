import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Books } from '../_model/books';
import { Users } from '../_model/users';
import { ReservationRequest } from '../_model/reservation-request';
import { ReservationService } from '../_service/reservation.service';

@Component({
  selector: 'app-reservation-form',
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit {

  @Input() livres: Books[] = [];
  @Input() adherents: Users[] = [];
  @Output() reservationCreee = new EventEmitter<void>();

  requete: ReservationRequest = new ReservationRequest();
  messageErreur: string | null = null;
  messageSucces: string | null = null;
  enAttente: boolean = false;

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
  }

  valide(): boolean {
    return this.requete.livreId != null && this.requete.adherentId != null;
  }

  soumettre() {
    if (!this.valide()) {
      this.messageErreur = 'Veuillez sélectionner un livre et un adhérent.';
      return;
    }

    this.messageErreur = null;
    this.messageSucces = null;
    this.enAttente = true;

    this.reservationService.creerReservation(this.requete).subscribe(
      (reservation) => {
        this.enAttente = false;
        this.messageSucces = 'Réservation créée avec succès !';
        this.reservationCreee.emit();
        this.requete = new ReservationRequest();

        setTimeout(() => {
          this.messageSucces = null;
        }, 3000);
      },
      (error) => {
        this.enAttente = false;

        console.log('Erreur brute:', error);
        console.log('error.error:', error.error);

        if (error.error && error.error.message) {
          this.messageErreur = error.error.message;
        } else {
          this.messageErreur = 'Une erreur est survenue.';
        }
      }
    );
  }
}
