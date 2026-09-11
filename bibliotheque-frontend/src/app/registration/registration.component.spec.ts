import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { RegistrationComponent } from './registration.component';
import { UsersService } from '../_service/users.service';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['createUser']);
    usersServiceSpy.createUser.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [RegistrationComponent],
      imports: [RouterTestingModule, FormsModule],
      providers: [{ provide: UsersService, useValue: usersServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });
});
