import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudlexTableComponent } from './cloudlex-table.component';

describe('CloudlexTableComponent', () => {
  let component: CloudlexTableComponent;
  let fixture: ComponentFixture<CloudlexTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudlexTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudlexTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
