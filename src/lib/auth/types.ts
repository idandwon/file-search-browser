export type AuthStatus =
  | 'missing'
  | 'bootstrapping'
  | 'authenticating'
  | 'authenticated'
  | 'invalid'

export type CredentialValidator<TCredential = string> = {
  readonly validate: (credential: TCredential) => Promise<void>
  readonly isAuthenticationError: (error: unknown) => boolean
  readonly getAuthenticationErrorMessage: (error: unknown) => string
  readonly getValidationErrorMessage: (error: unknown) => string
}
