import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { UserDetailsComponent } from './user-details.component';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UsersService } from '../_service/users.service';
import { Users } from '../_model/users';

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;

  beforeEach(async () => {
    const booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBookById']);
    const borrowServiceSpy = jasmine.createSpyObj('BorrowService', ['getBooksBorrowedByUser']);
    borrowServiceSpy.getBooksBorrowedByUser.and.returnValue(of([]));
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUserById', 'roleMatch']);
    const adherent = new Users();
    adherent.userId = 7;
    adherent.name = 'Adhérent Un';
    usersServiceSpy.getUserById.and.returnValue(of(adherent));
    usersServiceSpy.roleMatch.and.returnValue(false);

    await TestBed.configureTestingModule({
      declarations: [UserDetailsComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { userId: 7 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it("charge l'utilisateur et ses emprunts à partir du paramètre userId", () => {
    expect(component.user.name).toBe('Adhérent Un');
    expect(component.borrow).toEqual([]);
  });
});
