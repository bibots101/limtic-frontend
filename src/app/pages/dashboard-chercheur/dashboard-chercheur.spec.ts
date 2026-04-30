import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardChercheur } from './dashboard-chercheur';

describe('DashboardChercheur', () => {
  let component: DashboardChercheur;
  let fixture: ComponentFixture<DashboardChercheur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardChercheur],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardChercheur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
