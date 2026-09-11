import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';

/**
 * Le guard est la première barrière côté client : sans token → /login,
 * rôle insuffisant → /forbidden, rôle requis → accès autorisé.
 * (Traduction front des règles RS-01/RS-02 ; la décision finale reste
 * côté serveur.)
 */
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  let userAuthServiceSpy: jasmine.SpyObj<UserAuthService>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  const route = (roles?: string[]) => ({ data: roles ? { roles } : {} }) as any;
  const state = {} as any;

  beforeEach(() => {
    userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['getToken']);
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['roleMatch']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: UserAuthService, useValue: userAuthServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy }
      ]
    });
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('doit être créé', () => {
    expect(guard).toBeTruthy();
  });

  it("renvoie vers /login quand aucun token n'est présent", () => {
    // getToken() est typé string mais peut renvoyer null à l'exécution
    // (localStorage vide) — le guard teste d'ailleurs !== null.
    userAuthServiceSpy.getToken.and.returnValue(null as unknown as string);

    const resultat = guard.canActivate(route(['Admin']), state);

    expect(resultat).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('renvoie vers /forbidden quand le rôle ne correspond pas', () => {
    userAuthServiceSpy.getToken.and.returnValue('token');
    usersServiceSpy.roleMatch.and.returnValue(false);

    const resultat = guard.canActivate(route(['Admin']), state);

    expect(resultat).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('autorise le passage quand le rôle correspond', () => {
    userAuthServiceSpy.getToken.and.returnValue('token');
    usersServiceSpy.roleMatch.and.returnValue(true);

    const resultat = guard.canActivate(route(['Admin']), state);

    expect(resultat).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
