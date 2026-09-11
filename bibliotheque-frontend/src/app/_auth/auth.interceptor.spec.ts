import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthInterceptor } from './auth.interceptor';
import { UserAuthService } from '../_service/user-auth.service';

/**
 * L'intercepteur est l'écho client des règles RS-01 et RS-02 :
 * il ajoute le token à chaque requête, et traduit les refus du serveur
 * en navigation (401 -> /login, 403 -> /forbidden). La décision finale
 * de sécurité reste côté serveur.
 */
describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  let userAuthServiceSpy: jasmine.SpyObj<UserAuthService>;

  beforeEach(() => {
    userAuthServiceSpy = jasmine.createSpyObj('UserAuthService',
      ['getToken', 'getRoles', 'isLoggedIn']);
    userAuthServiceSpy.getToken.and.returnValue('jwt-de-test');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: UserAuthService, useValue: userAuthServiceSpy },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('ajoute le header Authorization Bearer à chaque requête', () => {
    httpClient.get('/api/reservations').subscribe();

    const requete = httpMock.expectOne('/api/reservations');
    expect(requete.request.headers.get('Authorization')).toBe('Bearer jwt-de-test');
    requete.flush([]);
  });

  it('ne touche pas au header quand la requête est marquée No-Auth', () => {
    httpClient.post('/authenticate', {}, { headers: { 'No-Auth': 'True' } }).subscribe();

    const requete = httpMock.expectOne('/authenticate');
    expect(requete.request.headers.get('Authorization')).toBeNull();
    requete.flush({});
  });

  it('redirige vers /login quand le serveur répond 401', () => {
    httpClient.get('/api/reservations').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('/api/reservations').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirige vers /forbidden quand le serveur répond 403', () => {
    httpClient.get('/api/reservations').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('/api/reservations').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('ne redirige pas pour une autre erreur (409 par exemple)', () => {
    httpClient.get('/api/reservations').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('/api/reservations').flush({}, { status: 409, statusText: 'Conflict' });

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
