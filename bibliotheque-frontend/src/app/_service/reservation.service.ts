import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '../_model/reservation';
import { ReservationRequest } from '../_model/reservation-request';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private baseURL = `${environment.apiUrl}/api/reservations`;

  constructor(private httpClient: HttpClient) { }

  getReservations(): Observable<Reservation[]> {
    return this.httpClient.get<Reservation[]>(`${this.baseURL}`);
  }

  getReservationsByStatut(statut: string): Observable<Reservation[]> {
    return this.httpClient.get<Reservation[]>(`${this.baseURL}?statut=${statut}`);
  }

  getReservationsByAdherent(adherentId: number): Observable<Reservation[]> {
    return this.httpClient.get<Reservation[]>(`${this.baseURL}?adherentId=${adherentId}`);
  }

  creerReservation(requete: ReservationRequest): Observable<Reservation> {
    return this.httpClient.post<Reservation>(`${this.baseURL}`, requete);
  }

  annulerReservation(id: number): Observable<Reservation> {
    return this.httpClient.patch<Reservation>(`${this.baseURL}/${id}/annuler`, null);
  }
}
