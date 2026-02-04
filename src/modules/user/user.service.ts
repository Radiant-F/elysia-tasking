import { ConflictError, NotFoundError } from "../../lib/errors";
import { userRepository } from "./user.repository";

export const userService = {
  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      username: user.username,
    };
  },

  async updateMe(
    userId: string,
    input: { username?: string; password?: string },
  ) {
    if (input.username) {
      const existing = await userRepository.findByUsername(input.username);
      if (existing && existing.id !== userId) {
        throw new ConflictError("Username already exists");
      }
    }

    const updates: { username?: string; passwordHash?: string } = {};

    if (input.username) {
      updates.username = input.username;
    }

    if (input.password) {
      updates.passwordHash = await Bun.password.hash(input.password);
    }

    const user = await userRepository.update(userId, updates);

    return {
      id: user.id,
      username: user.username,
    };
  },

  async deleteMe(userId: string): Promise<void> {
    await userRepository.delete(userId);
  },
};
