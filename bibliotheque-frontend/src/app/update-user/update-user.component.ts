import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Users } from '../_model/users';
import { UsersService } from '../_service/users.service';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css']
})
export class UpdateUserComponent implements OnInit {

  userId: number;
  user: Users = new Users();
  selectedRole: string = 'User';
  roleOptions = ['User', 'Admin'];
  errorMessage: string | null = null;
  submitted = false;

  constructor(private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['userId'];
    this.usersService.getUserById(this.userId).subscribe(data => {
      this.user = data;
      if (this.user.role && this.user.role.length > 0) {
        this.selectedRole = this.user.role[0].roleName;
      }
    });
  }

  onSubmit() {
    if (this.selectedRole) {
      this.user.role = [{ roleName: this.selectedRole }];
    } else {
      this.user.role = [];
    }
    this.submitted = true;
    this.errorMessage = null;
    this.usersService.updateUser(this.userId, this.user).subscribe(data => {
        this.goToUsersList();
    },
    error => {
      this.submitted = false;
      this.errorMessage = 'Impossible de modifier l\'utilisateur.';
    });
  }

  goToUsersList() {
    this.router.navigate(['/users']);
  }

}
