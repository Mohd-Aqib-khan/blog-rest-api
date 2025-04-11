interface GooglePayload {
  name?: string;
  email?: string;
  picture?: string;
  provider: 'google';
  sub: string;
}

export { GooglePayload };
