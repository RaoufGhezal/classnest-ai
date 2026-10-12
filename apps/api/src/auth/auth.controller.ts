import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin() {
    /* Passport redirects to Google. */
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const user = await this.auth.validateGoogleUser(req.user);
    const tokens = await this.auth.issueTokens(user);
    res.cookie("cn_access", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.cookie("cn_refresh", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/auth",
    });
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`,
    );
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = (req as any).cookies?.cn_refresh;
    if (!refreshToken)
      throw new UnauthorizedException(
        "Missing refresh token. Please sign in again.",
      );
    const tokens = await this.auth.refresh(refreshToken);
    res.cookie("cn_access", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.cookie("cn_refresh", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/auth",
    });
    return res.status(200).json({ ok: true });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: any }) {
    return req.user;
  }

  @Get("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request & { user: { sessionId: string } },
    @Res() res: Response,
  ) {
    await this.auth.logout(req.user.sessionId);
    res.clearCookie("cn_access", { path: "/" });
    res.clearCookie("cn_refresh", { path: "/auth" });
    return res.status(200).json({ ok: true });
  }
}
