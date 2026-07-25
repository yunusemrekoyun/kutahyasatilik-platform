export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 100;
export const PASSWORD_REQUIREMENT =
  `${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} karakter`;
export const PASSWORD_ERROR =
  `Şifre ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} karakter olmalı`;

export function isPasswordLengthValid(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
  );
}
