// MySQL implementation of UserRepository. Database column names stay inside this file.
import type { Pool, RowDataPacket } from "mysql2/promise";
import type { User, UserRole } from "../domain/user.ts";
import type { UserRepository } from "./userRepository.ts";

type UserRow = RowDataPacket & { id: string; name: string; role: UserRole; consultant_id: string | null };

function toUser(row: UserRow): User {
  return { id: row.id, name: row.name, role: row.role, consultantId: row.consultant_id };
}

export function createMysqlUserRepository(db: Pool): UserRepository {
  return {
    listUsers: async () => {
      const [rows] = await db.query<UserRow[]>("SELECT id, name, role, consultant_id FROM users ORDER BY id");
      return rows.map(toUser);
    },
    findUser: async (userId) => {
      const [rows] = await db.query<UserRow[]>("SELECT id, name, role, consultant_id FROM users WHERE id = ?", [userId]);
      return rows[0] ? toUser(rows[0]) : null;
    },
  };
}
