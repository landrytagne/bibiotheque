import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { BooksListComponent } from './books-list.component';
import { BooksService } from '../_service/books.service';

describe('BooksListComponent', () => {
  let component: BooksListComponent;
  let fixture: ComponentFixture<BooksListComponent>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBooksList']);
    booksServiceSpy.getBooksList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [BooksListComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: BooksService, useValue: booksServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(BooksListComponent);
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
