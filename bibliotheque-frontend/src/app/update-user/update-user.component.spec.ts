import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { UpdateUserComponent } from './update-user.component';
import { UsersService } from '../_service/users.service';
import { Users } from '../_model/users';

describe('UpdateUserComponent', () => {
  let component: UpdateUserComponent;
  let fixture: ComponentFixture<UpdateUserComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let router: Router;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUserById', 'updateUser']);
    const adherent = new Users();
    adherent.userId = 7;
    adherent.name = 'Adhérent Un';
    adherent.username = 'adherent.un';
    adherent.role = [{ roleName: 'User' }];
    usersServiceSpy.getUserById.and.returnValue(of(adherent));

    await TestBed.configureTestingModule({
      declarations: [UpdateUserComponent],
      imports: [RouterTestingModule, FormsModule],
      providers: [
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { userId: 7 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateUserComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it("charge l'utilisateur et préselectionne son rôle", () => {
    expect(usersServiceSpy.getUserById).toHaveBeenCalledWith(7);
    expect(component.selectedRole).toBe('User');
  });
});
