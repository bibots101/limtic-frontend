import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Axes } from './axes';

describe('Axes', () => {
  let component: Axes;
  let fixture: ComponentFixture<Axes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Axes],
    }).compileComponents();

    fixture = TestBed.createComponent(Axes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
