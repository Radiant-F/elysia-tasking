import { authRepository } from "./auth.repository";
import { ConflictError, UnauthorizedError } from "../../lib/errors";

export const authService = {
  async signup(input: { username: string; password: string }) {
    const existing = await authRepository.findByUsername(input.username);
    if (existing) {
      throw new ConflictError("Username already exists");
    }

    const passwordHash = await Bun.password.hash(input.password);
    const user = await authRepository.create({
      username: input.username,
      passwordHash,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        tokenVersion: user.tokenVersion,
      },
    };
  },

  async signin(input: { username: string; password: string }) {
    const user = await authRepository.findByUsername(input.username);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValid = await Bun.password.verify(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        tokenVersion: user.tokenVersion,
      },
    };
  },

  async getUserById(id: string) {
    const user = await authRepository.findById(id);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      tokenVersion: user.tokenVersion,
    };
  },

  async logout(userId: string): Promise<void> {
    await authRepository.incrementTokenVersion(userId);
  },
};
