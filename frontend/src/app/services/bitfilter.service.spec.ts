import { TestBed } from '@angular/core/testing';

import { BitfilterService } from './bitfilter.service';

describe('BitfilterService', () => {
  let service: BitfilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BitfilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
