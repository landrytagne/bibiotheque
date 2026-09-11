import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { UsersListComponent } from './users-list.component';
import { UsersService } from '../_service/users.service';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUsersList']);
    usersServiceSpy.getUsersList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [UsersListComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: UsersService, useValue: usersServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it("charge la liste des utilisateurs à l'initialisation", () => {
    expect(usersServiceSpy.getUsersList).toHaveBeenCalled();
  });
});
