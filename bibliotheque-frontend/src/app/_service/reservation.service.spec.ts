import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReservationService } from './reservation.service';
import { Reservation } from '../_model/reservation';
import { ReservationRequest } from '../_model/reservation-request';
import { environment } from '../../environments/environment';

/**
 * Test unitaire du service Réservation : chaque appel HTTP est vérifié
 * (URL, méthode, corps) contre le backend, sans réseau réel —
 * HttpClientTestingModule joue le rôle du serveur.
 */
describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  const API = `${environment.apiUrl}/api/reservations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReservationService]
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  it('getReservations interroge GET /api/reservations et renvoie la liste', () => {
    const mock: Reservation[] = [{
      id: 1, livreId: 10, livreNom: 'Livre A', adherentId: 7, adherentNom: 'Adhérent Un',
      dateReservation: '2026-09-01T10:00:00', dateExpiration: '2026-09-08T10:00:00', statut: 'EN_ATTENTE'
    }];

    service.getReservations().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].statut).toBe('EN_ATTENTE');
    });

    const requete = httpMock.expectOne(API);
    expect(requete.request.method).toBe('GET');
    requete.flush(mock);
  });

  it('getReservationsByStatut envoie le filtre statut en paramètre', () => {
    service.getReservationsByStatut('EN_ATTENTE').subscribe();

    const requete = httpMock.expectOne(`${API}?statut=EN_ATTENTE`);
    expect(requete.request.method).toBe('GET');
    requete.flush([]);
  });

  it('getReservationsByAdherent envoie le filtre adherentId en paramètre', () => {
    service.getReservationsByAdherent(7).subscribe();

    const requete = httpMock.expectOne(`${API}?adherentId=7`);
    expect(requete.request.method).toBe('GET');
    requete.flush([]);
  });

  it('creerReservation envoie POST /api/reservations avec le corps {livreId, adherentId}', () => {
    const requeteCreer: ReservationRequest = { livreId: 10, adherentId: 7 };
    const mock: Reservation = {
      id: 2, livreId: 10, livreNom: 'Livre A', adherentId: 7, adherentNom: 'Adhérent Un',
      dateReservation: '2026-09-11T10:00:00', dateExpiration: '2026-09-18T10:00:00', statut: 'EN_ATTENTE'
    };

    service.creerReservation(requeteCreer).subscribe(data => {
      expect(data.id).toBe(2);
    });

    const requete = httpMock.expectOne(API);
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(requeteCreer);
    requete.flush(mock);
  });

  it('annulerReservation envoie PATCH /api/reservations/{id}/annuler', () => {
    service.annulerReservation(3).subscribe();

    const requete = httpMock.expectOne(`${API}/3/annuler`);
    expect(requete.request.method).toBe('PATCH');
    requete.flush({});
  });
});
