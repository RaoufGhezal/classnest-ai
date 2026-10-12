import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { User } from "../users/user.entity";
import { Session } from "./session.entity";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly jwt: JwtService,
  ) {}

  async validateGoogleUser(profile: any) {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!googleId || !email)
      throw new UnauthorizedException(
        "Google account did not provide an email.",
      );
    const existing = await this.users.findOneBy({ googleId });
    if (existing) {
      existing.email = email;
      existing.name = profile.displayName || email;
      existing.picture = profile.photos?.[0]?.value || null;
      return this.users.save(existing);
    }
    const emailOwner = await this.users.findOneBy({ email });
    if (emailOwner)
      throw new UnauthorizedException(
        "This email is already associated with another login identity. Contact support to link it safely.",
      );
    return this.users.save(
      this.users.create({
        googleId,
        email,
        name: profile.displayName || email,
        picture: profile.photos?.[0]?.value || null,
      }),
    );
  }
  async issueTokens(user: Pick<User, "id" | "email">) {
    const session = await this.sessions.save(
      this.sessions.create({
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      }),
    );
    return this.signTokens(user, session.id);
  }

  private async signTokens(
    user: Pick<User, "id" | "email">,
    sessionId: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, sessionId, type: "access" },
      { secret: process.env.JWT_SECRET, expiresIn: "15m" },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sessionId, type: "refresh" },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: "7d" },
    );
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; sessionId: string; type: string };
    try {
      payload = await this.jwt.verifyAsync<{
        sub: string;
        sessionId: string;
        type: string;
      }>(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException(
        "Refresh token is invalid or expired. Please sign in again.",
      );
    }

    if (payload.type !== "refresh" || !payload.sub || !payload.sessionId) {
      throw new UnauthorizedException(
        "Refresh token is invalid or expired. Please sign in again.",
      );
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
      throw new UnauthorizedException(
        "Refresh token is invalid or expired. Please sign in again.",
      );
    }

    return this.signTokens(session.user, session.id);
  }

  async logout(sessionId: string) {
    await this.sessions.delete({ id: sessionId });
  }
}
