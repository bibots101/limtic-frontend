import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvenementDetail } from './evenement-detail';

describe('EvenementDetail', () => {
  let component: EvenementDetail;
  let fixture: ComponentFixture<EvenementDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvenementDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvenementDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
