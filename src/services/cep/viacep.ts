import { axiosInstance } from '#libs'

export interface CepResponse {
  cep: string
  logradouro: string
  complemento: string
  unidade: string
  bairro: string
  localidade: string
  uf: string
  estado: string
  regiao: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

export const VIA_CEP_URL = 'https://viacep.com.br/ws'

export async function getCep(cep: string): Promise<CepResponse> {
  try {
    const response = await axiosInstance.get(`${VIA_CEP_URL}/${cep}/json`)

    if (response.data && !response.data.error) {
      return response.data
    }

    throw new Error('CEP not found in ViaCEP or invalid')
  } catch (error) {
    console.error('Error fetching CEP:', error)
    throw error
  }
}
