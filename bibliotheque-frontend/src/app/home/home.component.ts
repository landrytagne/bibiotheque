import { Component, OnInit } from '@angular/core';
import { UserAuthService } from '../_service/user-auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  name: string | null = null;

  constructor(private userAuthService: UserAuthService) { }

  ngOnInit(): void {
    this.name = this.userAuthService.getName();
  }

  isLoggedIn(): boolean {
    return !!this.userAuthService.isLoggedIn();
  }

}
