import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['login', 'roleMatch']);
    const userAuthServiceSpy = jasmine.createSpyObj('UserAuthService',
      ['setRoles', 'setToken', 'setUserId', 'getName', 'isLoggedIn']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [RouterTestingModule, FormsModule],
      providers: [
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: UserAuthService, useValue: userAuthServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });
});
