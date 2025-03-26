import { axiosInstance } from '#libs'
import AxiosMockAdapter from 'axios-mock-adapter'
import { getCep, VIA_CEP_URL } from '../viacep.js'

const mock = new AxiosMockAdapter(axiosInstance)

const exampleResponse = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  unidade: '',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  estado: 'São Paulo',
  regiao: 'Sudeste',
  ibge: '3550308',
  gia: '1004',
  ddd: '11',
  siafi: '7107',
}

describe('viacep', () => {
  it('should fetch CEP data', async () => {
    mock.onGet(`${VIA_CEP_URL}/01001-000/json`).reply(200, exampleResponse)

    const cepData = await getCep('01001-000')

    expect(cepData).toEqual(exampleResponse)
  })

  it('should throw error on failed fetch', async () => {
    mock.onGet(`${VIA_CEP_URL}/01001-000/json`).reply(404)

    await expect(getCep('01001-000')).rejects.toThrow('Request failed with status code 404')
  })

  it('return error true on missing CEP data', async () => {
    mock.onGet(`${VIA_CEP_URL}/01001-000/json`).reply(200, { error: true })

    await expect(getCep('01001-000')).rejects.toThrow('CEP not found in ViaCEP or invalid')
  })
})
