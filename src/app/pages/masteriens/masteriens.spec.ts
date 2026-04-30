import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Masteriens } from './masteriens';

describe('Masteriens', () => {
  let component: Masteriens;
  let fixture: ComponentFixture<Masteriens>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Masteriens],
    }).compileComponents();

    fixture = TestBed.createComponent(Masteriens);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
