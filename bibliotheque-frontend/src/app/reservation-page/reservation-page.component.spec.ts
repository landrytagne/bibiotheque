import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ReservationPageComponent } from './reservation-page.component';
import { ReservationListComponent } from '../reservation-list/reservation-list.component';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';
import { ReservationService } from '../_service/reservation.service';
import { BooksService } from '../_service/books.service';
import { UsersService } from '../_service/users.service';
import { UserAuthService } from '../_service/user-auth.service';
import { Reservation } from '../_model/reservation';

/**
 * Test d'intégration de la page Réservations : vérifie le comportement
 * selon le rôle (règles RS-02/RS-05 vues du client) et l'affichage des
 * erreurs renvoyées par le backend. Les services sont simulés par des
 * espions ; aucun backend ne tourne.
 */
describe('ReservationPageComponent', () => {
  let component: ReservationPageComponent;
  let fixture: ComponentFixture<ReservationPageComponent>;

  let reservationServiceSpy: jasmine.SpyObj<ReservationService>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let userAuthServiceSpy: jasmine.SpyObj<UserAuthService>;

  const reservationUser: Reservation = {
    id: 1, livreId: 10, livreNom: 'Livre A', adherentId: 7, adherentNom: 'Adhérent Un',
    dateReservation: '2026-09-01T10:00:00', dateExpiration: '2026-09-08T10:00:00', statut: 'EN_ATTENTE'
  };

  beforeEach(async () => {
    reservationServiceSpy = jasmine.createSpyObj('ReservationService',
      ['getReservations', 'getReservationsByStatut', 'getReservationsByAdherent', 'creerReservation', 'annulerReservation']);
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBooksList']);
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUsersList', 'roleMatch']);
    userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['getUserId', 'getRoles', 'getToken']);

    await TestBed.configureTestingModule({
      declarations: [ReservationPageComponent, ReservationListComponent, ReservationFormComponent],
      imports: [RouterTestingModule, FormsModule],
      providers: [
        { provide: ReservationService, useValue: reservationServiceSpy },
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: UserAuthService, useValue: userAuthServiceSpy }
      ]
    }).compileComponents();

    // valeurs par défaut raisonnables, réécrites par test au besoin
    usersServiceSpy.roleMatch.and.returnValue(false);
    usersServiceSpy.getUsersList.and.returnValue(of([]));
    userAuthServiceSpy.getUserId.and.returnValue(7);
    booksServiceSpy.getBooksList.and.returnValue(of([]));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReservationPageComponent);
    component = fixture.componentInstance;
  });

  it('doit être créé', () => {
    reservationServiceSpy.getReservationsByAdherent.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('un User charge ses réservations par son identifiant (miroir de RS-05) et ne voit pas le formulaire', () => {
    usersServiceSpy.roleMatch.and.returnValue(false);          // pas Admin
    userAuthServiceSpy.getUserId.and.returnValue(7);
    reservationServiceSpy.getReservationsByAdherent.and.returnValue(of([reservationUser]));

    fixture.detectChanges();

    expect(reservationServiceSpy.getReservationsByAdherent).toHaveBeenCalledWith(7);
    expect(reservationServiceSpy.getReservations).not.toHaveBeenCalled();
    expect(component.reservations.length).toBe(1);
    expect(component.reservations[0].adherentId).toBe(7);
    expect(component.estAdmin).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-reservation-form')).toBeNull();
  });

  it('un Admin charge toutes les réservations et voit le formulaire de création', () => {
    usersServiceSpy.roleMatch.and.returnValue(true);           // Admin
    reservationServiceSpy.getReservations.and.returnValue(of([reservationUser]));

    fixture.detectChanges();

    expect(reservationServiceSpy.getReservations).toHaveBeenCalled();
    expect(reservationServiceSpy.getReservationsByAdherent).not.toHaveBeenCalled();
    expect(component.estAdmin).toBeTrue();
    expect(fixture.nativeElement.querySelector('app-reservation-form')).not.toBeNull();
  });

  it('un Admin filtre par statut via getReservationsByStatut', () => {
    usersServiceSpy.roleMatch.and.returnValue(true);
    reservationServiceSpy.getReservations.and.returnValue(of([]));
    reservationServiceSpy.getReservationsByStatut.and.returnValue(of([reservationUser]));

    fixture.detectChanges();
    component.filtrer('EN_ATTENTE');

    expect(reservationServiceSpy.getReservationsByStatut).toHaveBeenCalledWith('EN_ATTENTE');
    expect(component.reservations.length).toBe(1);
  });

  it('affiche le message du backend quand le chargement échoue (403 Forbidden)', () => {
    reservationServiceSpy.getReservationsByAdherent.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'Accès refusé' } })));

    fixture.detectChanges();

    expect(component.erreurListe).toBe('Accès refusé');
    expect(component.chargement).toBeFalse();
  });

  it('affiche un message dédié quand le serveur est injoignable (status 0)', () => {
    reservationServiceSpy.getReservationsByAdherent.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })));

    fixture.detectChanges();

    expect(component.erreurListe).toContain('serveur est injoignable');
  });

  it('confirme puis annule une réservation et recharge la liste', () => {
    reservationServiceSpy.getReservationsByAdherent.and.returnValue(of([]));
    reservationServiceSpy.annulerReservation.and.returnValue(of({ ...reservationUser, statut: 'ANNULEE' }));
    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();
    component.annuler(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(reservationServiceSpy.annulerReservation).toHaveBeenCalledWith(1);
    expect(component.messageSucces).toBe('Réservation annulée avec succès !');
  });

  it('ne fait rien si la confirmation est refusée', () => {
    reservationServiceSpy.getReservationsByAdherent.and.returnValue(of([]));
    spyOn(window, 'confirm').and.returnValue(false);

    fixture.detectChanges();
    component.annuler(1);

    expect(reservationServiceSpy.annulerReservation).not.toHaveBeenCalled();
  });
});
