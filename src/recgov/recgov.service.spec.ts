import { Test, TestingModule } from '@nestjs/testing';
import { RecGovService } from './recgov.service';

describe('RecGovService', () => {
  let service: RecGovService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecGovService],
    }).compile();

    service = module.get<RecGovService>(RecGovService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
