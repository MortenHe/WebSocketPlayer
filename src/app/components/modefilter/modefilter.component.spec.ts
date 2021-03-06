import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModefilterComponent } from './modefilter.component';

describe('ModefilterComponent', () => {
  let component: ModefilterComponent;
  let fixture: ComponentFixture<ModefilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModefilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModefilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
