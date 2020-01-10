import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAngularComponent } from './new-angular.component';

describe('NewAngularComponent', () => {
  let component: NewAngularComponent;
  let fixture: ComponentFixture<NewAngularComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewAngularComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewAngularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
