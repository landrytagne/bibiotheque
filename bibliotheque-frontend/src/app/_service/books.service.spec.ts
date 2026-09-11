import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BooksService } from './books.service';
import { environment } from '../../environments/environment';

describe('BooksService', () => {
  let service: BooksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BooksService]
    });
    service = TestBed.inject(BooksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  it('getBooksList interroge GET /admin/books', () => {
    service.getBooksList().subscribe();

    const requete = httpMock.expectOne(`${environment.apiUrl}/admin/books`);
    expect(requete.request.method).toBe('GET');
    requete.flush([]);
  });
});
