// What the sign-in needs from storage. Services depend on this type, not on MySQL.
import type { User } from "../domain/user.ts";

export type UserRepository = {
  listUsers(): Promise<User[]>;
  findUser(userId: string): Promise<User | null>;
};
