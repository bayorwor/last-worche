// MySQL implementation of UserRepository. Database column names stay inside this file.
import type { Pool, RowDataPacket } from "mysql2/promise";
import type { Role, User, UserRole } from "../domain/user.ts";
import type { UserAccount, UserRepository } from "./userRepository.ts";

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  consultant_id: string | null;
};
type AccountRow = UserRow & { password_hash: string };
type RoleRow = RowDataPacket & {
  id: UserRole;
  name_de: string;
  name_en: string;
  summary_de: string;
  summary_en: string;
};

function toUser(row: UserRow): User {
  return { id: row.id, name: row.name, email: row.email, role: row.role, consultantId: row.consultant_id };
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    names: { de: row.name_de, en: row.name_en },
    summaries: { de: row.summary_de, en: row.summary_en },
  };
}

export function createMysqlUserRepository(db: Pool): UserRepository {
  return {
    listRoles: async () => {
      const [rows] = await db.query<RoleRow[]>("SELECT id, name_de, name_en, summary_de, summary_en FROM roles ORDER BY sort_order");
      return rows.map(toRole);
    },
    listUsers: async () => {
      const [rows] = await db.query<UserRow[]>(
        `SELECT users.id, users.name, users.email, users.role, users.consultant_id
         FROM users JOIN roles ON roles.id = users.role
         ORDER BY roles.sort_order, users.name`,
      );
      return rows.map(toUser);
    },
    findAccountByEmail: async (email): Promise<UserAccount | null> => {
      const [rows] = await db.query<AccountRow[]>(
        "SELECT id, name, email, role, consultant_id, password_hash FROM users WHERE email = ?",
        [email],
      );
      const row = rows[0];
      return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
    },
  };
}
