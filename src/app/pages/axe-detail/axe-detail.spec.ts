import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AxeDetail } from './axe-detail';

describe('AxeDetail', () => {
  let component: AxeDetail;
  let fixture: ComponentFixture<AxeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AxeDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AxeDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
