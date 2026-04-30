import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterienDetail } from './masterien-detail';

describe('MasterienDetail', () => {
  let component: MasterienDetail;
  let fixture: ComponentFixture<MasterienDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterienDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterienDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
