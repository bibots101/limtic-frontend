import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorantDetail } from './doctorant-detail';

describe('DoctorantDetail', () => {
  let component: DoctorantDetail;
  let fixture: ComponentFixture<DoctorantDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorantDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorantDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
