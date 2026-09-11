import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    const userAuthServiceSpy = jasmine.createSpyObj('UserAuthService',
      ['getName', 'isLoggedIn', 'clear']);
    userAuthServiceSpy.getName.and.returnValue('Test');
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['roleMatch']);
    usersServiceSpy.roleMatch.and.returnValue(false);

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: UserAuthService, useValue: userAuthServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });
});
