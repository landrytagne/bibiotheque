import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Books } from '../_model/books';
import { Users } from '../_model/users';
import { Reservation } from '../_model/reservation';
import { ReservationService } from '../_service/reservation.service';
import { BooksService } from '../_service/books.service';
import { UsersService } from '../_service/users.service';
import { UserAuthService } from '../_service/user-auth.service';

@Component({
  selector: 'app-reservation-page',
  templateUrl: './reservation-page.component.html',
  styleUrls: ['./reservation-page.component.css']
})
export class ReservationPageComponent implements OnInit {

  reservations: Reservation[] = [];
  livres: Books[] = [];
  adherents: Users[] = [];

  chargement: boolean = false;
  erreurListe: string | null = null;
  messageSucces: string | null = null;

  statutSelectionne: string = 'TOUS';
  estAdmin: boolean = false;
  userId: number | null = null;

  constructor(
    private reservationService: ReservationService,
    private booksService: BooksService,
    private usersService: UsersService,
    private userAuthService: UserAuthService
  ) { }

  ngOnInit(): void {
    this.estAdmin = this.usersService.roleMatch(['Admin']);
    this.userId = this.userAuthService.getUserId();
    this.chargerReservations();
    this.chargerLivres();
    if (this.estAdmin) {
      this.chargerAdherents();
    }
  }

  chargerReservations() {
    this.chargement = true;
    this.erreurListe = null;
    const statut = this.statutSelectionne === 'TOUS' ? null : this.statutSelectionne;

    let observable;
    if (!this.estAdmin) {
      observable = this.reservationService.getReservationsByAdherent(this.userId!);
    } else if (statut) {
      observable = this.reservationService.getReservationsByStatut(statut);
    } else {
      observable = this.reservationService.getReservations();
    }

    observable.subscribe(
      data => {
        this.reservations = data;
        this.chargement = false;
      },
      error => {
        this.chargement = false;
        if (error.error && error.error.message) {
          this.erreurListe = error.error.message;
        } else if (error.status === 0) {
          this.erreurListe = 'Le serveur est injoignable.';
        } else {
          this.erreurListe = 'Impossible de charger les réservations.';
        }
      }
    );
  }

  private chargerLivres() {
    this.booksService.getBooksList().subscribe(data => {
      this.livres = data;
    });
  }

  private chargerAdherents() {
    this.usersService.getUsersList().subscribe(data => {
      this.adherents = data;
    });
  }

  filtrer(statut: string) {
    this.statutSelectionne = statut;
    this.chargerReservations();
  }

  reessayer() {
    this.chargerReservations();
  }

  annuler(id: number) {
    const confirmé = window.confirm('Confirmez-vous l\'annulation de cette réservation ?');
    if (!confirmé) {
      return;
    }
    this.reservationService.annulerReservation(id).subscribe(
      () => {
        this.messageSucces = 'Réservation annulée avec succès !';
        this.chargerReservations();

        setTimeout(() => {
          this.messageSucces = null;
        }, 3000);
      },
      (error) => {
        let message = 'Une erreur est survenue lors de l\'annulation.';
        if (error.error && error.error.message) {
          message = error.error.message;
        }
        window.alert(message);
      }
    );
  }
}
