import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChercheurDetail } from './chercheur-detail';

describe('ChercheurDetail', () => {
  let component: ChercheurDetail;
  let fixture: ComponentFixture<ChercheurDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChercheurDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ChercheurDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
