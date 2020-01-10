import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClxFooterComponent } from './clx-footer.component';

describe('ClxFooterComponent', () => {
  let component: ClxFooterComponent;
  let fixture: ComponentFixture<ClxFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClxFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClxFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
