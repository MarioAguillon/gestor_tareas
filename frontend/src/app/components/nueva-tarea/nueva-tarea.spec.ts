import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaTarea } from './nueva-tarea';

describe('NuevaTarea', () => {
  let component: NuevaTarea;
  let fixture: ComponentFixture<NuevaTarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaTarea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaTarea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
