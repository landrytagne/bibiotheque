import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Books } from '../_model/books';
import { Users } from '../_model/users';
import { ReservationRequest } from '../_model/reservation-request';

@Component({
  selector: 'app-reservation-form',
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit {

  @Input() livres: Books[] = [];
  @Input() adherents: Users[] = [];
  @Output() creer = new EventEmitter<ReservationRequest>();

  requete: ReservationRequest = new ReservationRequest();
  messageErreur: string | null = null;
  enAttente: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  valide(): boolean {
    return this.requete.livreId != null && this.requete.adherentId != null;
  }

  soumettre() {
    if (!this.valide()) {
      return;
    }
    this.messageErreur = null;
    this.enAttente = true;
    this.creer.emit(this.requete);
  }

  surErreur(message: string) {
    this.enAttente = false;
    this.messageErreur = message;
  }

  surSucces() {
    this.enAttente = false;
    this.messageErreur = null;
    this.requete = new ReservationRequest();
  }
}
