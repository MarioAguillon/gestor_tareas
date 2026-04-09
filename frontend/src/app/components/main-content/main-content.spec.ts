import { ComponentFixture, TestBed } from '@angular/core/testing';

// Cambiamos MainContent por MainContentComponent
import { MainContentComponent } from './main-content'; 

describe('MainContentComponent', () => {
  let component: MainContentComponent;
  let fixture: ComponentFixture<MainContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Aquí también debe decir MainContentComponent
      imports: [MainContentComponent] 
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Es mejor usar detectChanges para pruebas básicas
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});