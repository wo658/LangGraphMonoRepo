import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard attempts JWT auth if credentials are present, but does not error if absent/invalid.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Ignore errors and return user if available; otherwise null
    return user || null;
  }
}
