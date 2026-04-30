import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Doctorants } from './doctorants';

describe('Doctorants', () => {
  let component: Doctorants;
  let fixture: ComponentFixture<Doctorants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctorants],
    }).compileComponents();

    fixture = TestBed.createComponent(Doctorants);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
