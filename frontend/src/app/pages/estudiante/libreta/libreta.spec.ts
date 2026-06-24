import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Libreta } from './libreta';

describe('Libreta', () => {
  let component: Libreta;
  let fixture: ComponentFixture<Libreta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Libreta],
    }).compileComponents();

    fixture = TestBed.createComponent(Libreta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
