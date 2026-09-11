import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BorrowService } from './borrow.service';
import { environment } from '../../environments/environment';

describe('BorrowService', () => {
  let service: BorrowService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BorrowService]
    });
    service = TestBed.inject(BorrowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  it('getBorrowList interroge le endpoint borrow', () => {
    service.getBorrowList().subscribe();

    const requete = httpMock.expectOne(`${environment.apiUrl}/borrow`);
    expect(requete.request.method).toBe('GET');
    requete.flush([]);
  });
});
