import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocenteDashboard } from './dashboard';

describe('DocenteDashboard', () => {
  let component: DocenteDashboard;
  let fixture: ComponentFixture<DocenteDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocenteDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(DocenteDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});