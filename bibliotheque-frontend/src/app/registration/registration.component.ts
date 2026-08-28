import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Users } from '../_model/users';
import { UsersService } from '../_service/users.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {

  user: Users = new Users();
  selectedRole: string = 'User';
  roleOptions = ['User', 'Admin'];
  errorMessage: string | null = null;
  submitted = false;

  constructor(private usersService: UsersService,
    private router: Router) { }

  ngOnInit(): void {
  }

  private buildRole() {
    if (this.selectedRole) {
      this.user.role = [{ roleName: this.selectedRole }];
    } else {
      this.user.role = [];
    }
  }

  saveUser() {
    this.buildRole();
    this.submitted = true;
    this.errorMessage = null;
    this.usersService.createUser(this.user).subscribe(data => {
      this.goToUsersList();
    },
    error => {
      this.submitted = false;
      this.errorMessage = 'Impossible de créer l\'utilisateur. Vérifiez que tous les champs sont renseignés.';
    });
  }

  goToUsersList() {
    this.router.navigate(['/users']);
  }

  formValid(): boolean {
    return !!this.user.name && !!this.user.username && !!this.user.password && !!this.selectedRole;
  }

  onSubmit() {
    this.saveUser();
  }

}
