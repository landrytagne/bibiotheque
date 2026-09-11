import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservationListComponent } from './reservation-list.component';
import { Reservation } from '../_model/reservation';

/**
 * Miroir UX des règles RG-05/RG-06 : le bouton d'annulation n'apparaît
 * que pour une réservation active (EN_ATTENTE ou DISPONIBLE).
 */
describe('ReservationListComponent', () => {
  let component: ReservationListComponent;
  let fixture: ComponentFixture<ReservationListComponent>;

  const reservation = (statut: string): Reservation => ({
    id: 1, livreId: 10, livreNom: 'Livre A', adherentId: 7, adherentNom: 'Adhérent Un',
    dateReservation: '2026-09-01T10:00:00', dateExpiration: '2026-09-08T10:00:00', statut
  } as Reservation);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReservationListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationListComponent);
    component = fixture.componentInstance;
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it('affiche le bouton Annuler pour une réservation active', () => {
    component.reservations = [reservation('EN_ATTENTE')];
    fixture.detectChanges();

    expect(component.boutonAnnulationVisible(component.reservations[0])).toBeTrue();
    expect(fixture.nativeElement.querySelector('.btn-outline-danger')).not.toBeNull();
  });

  it('affiche aussi le bouton Annuler pour une réservation DISPONIBLE', () => {
    expect(component.boutonAnnulationVisible(reservation('DISPONIBLE'))).toBeTrue();
  });

  it('masque le bouton Annuler pour une réservation ANNULEE', () => {
    component.reservations = [reservation('ANNULEE')];
    fixture.detectChanges();

    expect(component.boutonAnnulationVisible(component.reservations[0])).toBeFalse();
    expect(fixture.nativeElement.querySelector('.btn-outline-danger')).toBeNull();
  });

  it('masque le bouton Annuler pour les statuts terminaux EXPIREE et HONOREE', () => {
    expect(component.boutonAnnulationVisible(reservation('EXPIREE'))).toBeFalse();
    expect(component.boutonAnnulationVisible(reservation('HONOREE'))).toBeFalse();
  });

  it('émet le statut choisi vers le composant parent', () => {
    let recu: any = null;
    component.filtrer.subscribe(s => recu = s);

    component.changerStatut('EN_ATTENTE');

    expect(recu).toBe('EN_ATTENTE');
  });

  it("émet l'identifiant à annuler vers le composant parent", () => {
    let recu: any = null;
    component.annuler.subscribe(id => recu = id);

    component.demanderAnnulation(3);

    expect(recu).toBe(3);
  });

  it('affiche un état vide quand aucune réservation ne correspond', () => {
    component.reservations = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucune réservation trouvée');
  });

  it("affiche le message d'erreur fourni par le parent", () => {
    component.erreur = 'Accès refusé';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Accès refusé');
  });
});
