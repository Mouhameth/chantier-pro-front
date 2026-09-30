import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string | null;
    } & DefaultSession['user'];
    accessToken: string;
    refreshToken: string;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      email: string;
      phone: string | null;
      address: string | null;
      status: string;
    };
  }

  interface User extends DefaultUser {
    role: string;
    tenantId: string | null;
    accessToken: string;
    refreshToken: string;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      email: string;
      phone: string | null;
      address: string | null;
      status: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    tenantId: string | null;
    accessToken: string;
    refreshToken: string;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      email: string;
      phone: string | null;
      address: string | null;
      status: string;
    };
  }
}
