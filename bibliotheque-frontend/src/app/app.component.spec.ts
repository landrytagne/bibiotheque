import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { UserAuthService } from './_service/user-auth.service';
import { UsersService } from './_service/users.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const userAuthServiceSpy = jasmine.createSpyObj('UserAuthService',
      ['getName', 'isLoggedIn', 'getToken', 'getRoles']);
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['roleMatch']);
    usersServiceSpy.roleMatch.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent, HeaderComponent],
      providers: [
        { provide: UserAuthService, useValue: userAuthServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy }
      ]
    }).compileComponents();
  });

  it('doit être créé', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
