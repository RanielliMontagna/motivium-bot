declare module 'axios-mock-adapter' {
  import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

  type RequestHandler = (config: AxiosRequestConfig) => [number, any?, AxiosResponse['headers']?]

  class MockAdapter {
    constructor(
      axiosInstance: AxiosInstance,
      options?: { delayResponse?: number; onNoMatch?: 'passthrough' | 'throwException' },
    )

    restore(): void
    reset(): void
    resetHandlers(): void
    resetHistory(): void

    onGet(url: string | RegExp, config?: AxiosRequestConfig): MockAdapter
    onPost(url: string | RegExp, config?: AxiosRequestConfig): MockAdapter
    onPut(url: string | RegExp, config?: AxiosRequestConfig): MockAdapter
    onDelete(url: string | RegExp, config?: AxiosRequestConfig): MockAdapter
    onPatch(url: string | RegExp, config?: AxiosRequestConfig): MockAdapter
    onHead(url: string | RegExp, config?: AxiosRequestConfig): MockAdapter
    onOptions(url: string | RegExp, config?: AxiosRequestConfig): MockAdapter

    reply(status: number, data?: any, headers?: AxiosResponse['headers']): MockAdapter
    replyOnce(status: number, data?: any, headers?: AxiosResponse['headers']): MockAdapter
  }

  export default MockAdapter
}
