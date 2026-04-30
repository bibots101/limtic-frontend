import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Outils } from './outils';

describe('Outils', () => {
  let component: Outils;
  let fixture: ComponentFixture<Outils>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Outils],
    }).compileComponents();

    fixture = TestBed.createComponent(Outils);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
