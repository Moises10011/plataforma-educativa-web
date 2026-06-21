import { TestBed } from '@angular/core/testing';

import { Galeria } from './galeria';

describe('Galeria', () => {
  let service: Galeria;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Galeria);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
