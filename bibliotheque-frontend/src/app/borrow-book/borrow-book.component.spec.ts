import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { BorrowBookComponent } from './borrow-book.component';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UserAuthService } from '../_service/user-auth.service';

describe('BorrowBookComponent', () => {
  let component: BorrowBookComponent;
  let fixture: ComponentFixture<BorrowBookComponent>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let borrowServiceSpy: jasmine.SpyObj<BorrowService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBooksList']);
    booksServiceSpy.getBooksList.and.returnValue(of([]));
    borrowServiceSpy = jasmine.createSpyObj('BorrowService', ['borrowBook']);
    const userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['getUserId']);
    userAuthServiceSpy.getUserId.and.returnValue(7);

    await TestBed.configureTestingModule({
      declarations: [BorrowBookComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: UserAuthService, useValue: userAuthServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BorrowBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it("charge la liste des livres à l'initialisation", () => {
    expect(booksServiceSpy.getBooksList).toHaveBeenCalled();
  });
});
