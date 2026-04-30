import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chercheurs } from './chercheurs';

describe('Chercheurs', () => {
  let component: Chercheurs;
  let fixture: ComponentFixture<Chercheurs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chercheurs],
    }).compileComponents();

    fixture = TestBed.createComponent(Chercheurs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
