export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'E-mail inválido.',
  INCORRECT_PASSWORD: 'Senha incorreta.',
  CNJ_FAILURE: 'Falha ao buscar dados do CNJ.',
  NOT_FOUND: 'Item não encontrado.',
  NETWORK: 'Falha de conexão. Verifique sua internet.'
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

export function getErrorMessage(key: ErrorMessageKey): string {
  return ERROR_MESSAGES[key];
}
