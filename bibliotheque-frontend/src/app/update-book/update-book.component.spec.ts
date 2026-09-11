import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { UpdateBookComponent } from './update-book.component';
import { BooksService } from '../_service/books.service';
import { Books } from '../_model/books';

describe('UpdateBookComponent', () => {
  let component: UpdateBookComponent;
  let fixture: ComponentFixture<UpdateBookComponent>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let router: Router;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBookById', 'updateBook']);
    const livre = new Books();
    livre.bookId = 5;
    livre.bookName = 'Livre test';
    booksServiceSpy.getBookById.and.returnValue(of(livre));

    await TestBed.configureTestingModule({
      declarations: [UpdateBookComponent],
      imports: [RouterTestingModule, FormsModule],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { bookId: 5 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateBookComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  it('charge le livre à partir du paramètre bookId', () => {
    expect(booksServiceSpy.getBookById).toHaveBeenCalledWith(5);
    expect(component.book.bookName).toBe('Livre test');
  });

  it('soumet la mise à jour puis navigue vers la liste', () => {
    booksServiceSpy.updateBook.and.returnValue(of({}));

    component.onSubmit();

    expect(booksServiceSpy.updateBook).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/books']);
  });
});
