import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { UserAuthService } from '../_service/user-auth.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const userAuthServiceSpy = jasmine.createSpyObj('UserAuthService',
      ['getName', 'isLoggedIn']);
    userAuthServiceSpy.getName.and.returnValue('Test');

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        { provide: UserAuthService, useValue: userAuthServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });
});
