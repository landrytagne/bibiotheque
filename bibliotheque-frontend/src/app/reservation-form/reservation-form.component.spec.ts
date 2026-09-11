import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ReservationFormComponent } from './reservation-form.component';
import { ReservationService } from '../_service/reservation.service';
import { ReservationRequest } from '../_model/reservation-request';

/**
 * Le formulaire est la porte d'entrée de la création côté client.
 * Ces tests sont le miroir frontend des règles backend : le corps
 * envoyé contient livreId + adherentId (RS-04, l'identité de l'adhérent
 * reste tranchée par le token côté serveur), et les refus RG-03 (409)
 * comme RS-04 (403) sont affichés à l'utilisateur plutôt que perdus.
 */
describe('ReservationFormComponent', () => {
  let component: ReservationFormComponent;
  let fixture: ComponentFixture<ReservationFormComponent>;
  let reservationServiceSpy: jasmine.SpyObj<ReservationService>;

  const requeteComplete = (): ReservationRequest => {
    const requete = new ReservationRequest();
    requete.livreId = 10;
    requete.adherentId = 7;
    return requete;
  };

  beforeEach(async () => {
    reservationServiceSpy = jasmine.createSpyObj('ReservationService', ['creerReservation']);

    await TestBed.configureTestingModule({
      declarations: [ReservationFormComponent],
      imports: [FormsModule],
      providers: [{ provide: ReservationService, useValue: reservationServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it('considère le formulaire invalide tant que livreId ou adherentId manque', () => {
    expect(component.valide()).toBeFalse();

    const sansAdherent = new ReservationRequest();
    sansAdherent.livreId = 10;
    component.requete = sansAdherent;
    expect(component.valide()).toBeFalse();

    component.requete = requeteComplete();
    expect(component.valide()).toBeTrue();
  });

  it('bloque la soumission et affiche un message quand le formulaire est incomplet', () => {
    component.soumettre();

    expect(reservationServiceSpy.creerReservation).not.toHaveBeenCalled();
    expect(component.messageErreur).toContain('Veuillez sélectionner');
  });

  it('envoie le corps {livreId, adherentId} au service et affiche le succès', () => {
    reservationServiceSpy.creerReservation.and.returnValue(of({ id: 9, statut: 'EN_ATTENTE' } as any));
    component.requete = requeteComplete();

    component.soumettre();

    // le corps envoyé est bien celui saisi, capturé avant la réinitialisation du composant
    const corpsEnvoye = reservationServiceSpy.creerReservation.calls.mostRecent().args[0];
    expect(corpsEnvoye.livreId).toBe(10);
    expect(corpsEnvoye.adherentId).toBe(7);
    expect(component.messageSucces).toBe('Réservation créée avec succès !');
    expect(component.messageErreur).toBeNull();
    expect(component.requete.livreId).toBeUndefined();
    expect(component.requete.adherentId).toBeUndefined();
  });

  it("affiche le message RG-03 du backend quand la limite de 3 réservations est atteinte (409)", () => {
    reservationServiceSpy.creerReservation.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 409, error: { message: "RG-03 : l'adhérent a déjà 3 réservations actives." } })));
    component.requete = requeteComplete();

    component.soumettre();

    expect(component.messageErreur).toContain('RG-03');
    expect(component.enAttente).toBeFalse();
  });

  it("affiche le message RS-04 du backend quand la création vise un autre adhérent (403)", () => {
    reservationServiceSpy.creerReservation.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 403, error: { message: "RS-04 : un adhérent ne peut pas créer une réservation au nom d'un autre adhérent." } })));
    component.requete = requeteComplete();

    component.soumettre();

    expect(component.messageErreur).toContain('RS-04');
  });

  it('affiche un message générique quand la réponse ne porte pas de message', () => {
    reservationServiceSpy.creerReservation.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 500 })));
    component.requete = requeteComplete();

    component.soumettre();

    expect(component.messageErreur).toBe('Une erreur est survenue.');
  });
});
