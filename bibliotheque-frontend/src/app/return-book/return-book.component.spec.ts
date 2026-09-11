import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ReturnBookComponent } from './return-book.component';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UserAuthService } from '../_service/user-auth.service';

describe('ReturnBookComponent', () => {
  let component: ReturnBookComponent;
  let fixture: ComponentFixture<ReturnBookComponent>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let borrowServiceSpy: jasmine.SpyObj<BorrowService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBooksList']);
    booksServiceSpy.getBooksList.and.returnValue(of([]));
    borrowServiceSpy = jasmine.createSpyObj('BorrowService',
      ['getBooksBorrowedByUser', 'returnBook']);
    borrowServiceSpy.getBooksBorrowedByUser.and.returnValue(of([]));
    const userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['getUserId']);
    userAuthServiceSpy.getUserId.and.returnValue(7);

    await TestBed.configureTestingModule({
      declarations: [ReturnBookComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: UserAuthService, useValue: userAuthServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it("charge les emprunts de l'utilisateur connecté", () => {
    expect(borrowServiceSpy.getBooksBorrowedByUser).toHaveBeenCalledWith(7);
  });
});
