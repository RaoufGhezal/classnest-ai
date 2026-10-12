import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Session } from "./session.entity";

function cookieExtractor(req: Request): string | null {
  return (req as any)?.cookies?.cn_access || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "",
    });
  }
  async validate(payload: { sub: string; sessionId: string; type: string }) {
    if (payload.type !== "access" || !payload.sub || !payload.sessionId) {
      throw new UnauthorizedException();
    }

    const session = await this.sessions.findOne({
      where: { id: payload.sessionId },
      relations: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException();
    }

    return {
      id: session.user.id,
      email: session.user.email,
      sessionId: session.id,
    };
  }
}
