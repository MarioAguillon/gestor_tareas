import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaComponent } from './tarea'; // Antes decía Tarea, ahora es TareaComponent

describe('TareaComponent', () => {
  let component: TareaComponent;
  let fixture: ComponentFixture<TareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});