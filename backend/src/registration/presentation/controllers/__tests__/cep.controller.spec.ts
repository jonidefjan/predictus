import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CepController } from '../cep.controller';
import { ViaCepProvider, CepResponse } from '../../../infrastructure/providers/viacep-cep.provider';

describe('CepController', () => {
  let controller: CepController;
  let cepProvider: jest.Mocked<ViaCepProvider>;

  const mockCepResponse: CepResponse = {
    cep: '01001-000',
    street: 'Praça da Sé',
    complement: 'lado ímpar',
    neighborhood: 'Sé',
    city: 'São Paulo',
    state: 'SP',
  };

  beforeEach(async () => {
    const mockProvider = { findByCep: jest.fn() } as jest.Mocked<Pick<ViaCepProvider, 'findByCep'>>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CepController],
      providers: [{ provide: ViaCepProvider, useValue: mockProvider }],
    }).compile();

    controller = module.get<CepController>(CepController);
    cepProvider = module.get(ViaCepProvider);
  });

  it('returns CepResponse when provider finds the CEP', async () => {
    cepProvider.findByCep.mockResolvedValueOnce(mockCepResponse);

    const result = await controller.findByCep('01001000');

    expect(result).toEqual(mockCepResponse);
    expect(cepProvider.findByCep).toHaveBeenCalledWith('01001000');
  });

  it('throws NotFoundException when provider returns null', async () => {
    cepProvider.findByCep.mockResolvedValueOnce(null);

    await expect(controller.findByCep('99999999')).rejects.toThrow(NotFoundException);
  });
});
