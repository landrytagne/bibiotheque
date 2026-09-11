import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { BookDetailsComponent } from './book-details.component';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UsersService } from '../_service/users.service';
import { Books } from '../_model/books';

describe('BookDetailsComponent', () => {
  let component: BookDetailsComponent;
  let fixture: ComponentFixture<BookDetailsComponent>;

  beforeEach(async () => {
    const booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBookById']);
    const livre = new Books();
    livre.bookId = 5;
    livre.bookName = 'Livre test';
    booksServiceSpy.getBookById.and.returnValue(of(livre));
    const borrowServiceSpy = jasmine.createSpyObj('BorrowService', ['getBookBorrowHistory']);
    borrowServiceSpy.getBookBorrowHistory.and.returnValue(of([]));
    const usersServiceSpy = jasmine.createSpyObj('UsersService', ['roleMatch']);
    usersServiceSpy.roleMatch.and.returnValue(false);

    await TestBed.configureTestingModule({
      declarations: [BookDetailsComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { bookId: 5 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it('charge le livre et son historique demprunt', () => {
    expect(component.book.bookName).toBe('Livre test');
    expect(component.borrow).toEqual([]);
  });
});
