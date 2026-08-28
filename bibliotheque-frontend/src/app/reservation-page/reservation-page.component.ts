import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Books } from '../_model/books';
import { Users } from '../_model/users';
import { Reservation } from '../_model/reservation';
import { ReservationRequest } from '../_model/reservation-request';
import { ReservationService } from '../_service/reservation.service';
import { BooksService } from '../_service/books.service';
import { UsersService } from '../_service/users.service';
import { UserAuthService } from '../_service/user-auth.service';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';

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

  statutSelectionne: string = 'TOUS';
  estAdmin: boolean = false;
  userId: number | null = null;

  @ViewChild(ReservationFormComponent) formRef!: ReservationFormComponent;

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

  private chargerReservations() {
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
        if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            this.erreurListe = 'Le serveur est injoignable. Vérifiez que le backend est démarré.';
          } else {
            this.erreurListe = 'Impossible de charger les réservations.';
          }
        } else {
          this.erreurListe = 'Une erreur est survenue lors du chargement des réservations.';
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

  creer(requete: ReservationRequest) {
    this.reservationService.creerReservation(requete).subscribe(
      () => {
        if (this.formRef) {
          this.formRef.surSucces();
        }
        this.chargerReservations();
      },
      (error: HttpErrorResponse) => this.gérerErreurCreation(error)
    );
  }

  private gérerErreurCreation(error: HttpErrorResponse) {
    let message = 'Une erreur est survenue.';
    if (error instanceof HttpErrorResponse) {
      const messageServeur = error.error && error.error.message;
      if (error.status === 400 || error.status === 404 || error.status === 409) {
        message = messageServeur || message;
      } else if (error.status === 401) {
        message = 'Veuillez vous connecter pour créer une réservation.';
      } else if (error.status === 403) {
        message = 'Vous n\'avez pas les droits pour créer une réservation.';
      }
    }
    if (this.formRef) {
      this.formRef.surErreur(message);
    }
  }

  annuler(id: number) {
    const confirmé = window.confirm('Confirmez-vous l\'annulation de cette réservation ?');
    if (!confirmé) {
      return;
    }
    this.reservationService.annulerReservation(id).subscribe(
      () => this.chargerReservations(),
      (error: HttpErrorResponse) => this.gérerErreurAnnulation(error)
    );
  }

  private gérerErreurAnnulation(error: HttpErrorResponse) {
    let message = 'Une erreur est survenue lors de l\'annulation.';
    if (error instanceof HttpErrorResponse) {
      const messageServeur = error.error && error.error.message;
      if (error.status === 409 || error.status === 404) {
        message = messageServeur || message;
      }
    }
    window.alert(message);
  }
}
