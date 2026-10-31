// MySQL implementation of UserRepository. Database column names stay inside this file.
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { Role, User, UserRole } from "../domain/user.ts";
import type { SignInCode, UserRepository } from "./userRepository.ts";

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  consultant_id: string | null;
};
type RoleRow = RowDataPacket & {
  id: UserRole;
  name_de: string;
  name_en: string;
  summary_de: string;
  summary_en: string;
};
type SignInCodeRow = RowDataPacket & {
  id: number;
  user_id: string;
  code_hash: string;
  created_at_ms: number;
  expires_at_ms: number;
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
    findUserByEmail: async (email) => {
      const [rows] = await db.query<UserRow[]>("SELECT id, name, email, role, consultant_id FROM users WHERE email = ?", [email]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    findUserById: async (userId) => {
      const [rows] = await db.query<UserRow[]>("SELECT id, name, email, role, consultant_id FROM users WHERE id = ?", [userId]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    updateUserName: async (userId, name) => {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("UPDATE users SET name = ? WHERE id = ?", [name, userId]);
        await connection.query(
          "UPDATE consultants SET name = ? WHERE id = (SELECT consultant_id FROM users WHERE id = ?)",
          [name, userId],
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    saveSignInCode: async ({ userId, codeHash, createdAtMs, expiresAtMs }) => {
      await db.query(
        `REPLACE INTO sign_in_codes (user_id, code_hash, created_at_ms, expires_at_ms, attempts)
         VALUES (?, ?, ?, ?, 0)`,
        [userId, codeHash, createdAtMs, expiresAtMs],
      );
    },
    findSignInCode: async (userId): Promise<SignInCode | null> => {
      const [rows] = await db.query<SignInCodeRow[]>(
        "SELECT id, user_id, code_hash, created_at_ms, expires_at_ms FROM sign_in_codes WHERE user_id = ?",
        [userId],
      );
      const row = rows[0];
      return row
        ? { id: row.id, userId: row.user_id, codeHash: row.code_hash, createdAtMs: row.created_at_ms, expiresAtMs: row.expires_at_ms }
        : null;
    },
    registerCodeAttempt: async (codeId, maxAttempts) => {
      const [result] = await db.query<ResultSetHeader>(
        "UPDATE sign_in_codes SET attempts = attempts + 1 WHERE id = ? AND attempts < ?",
        [codeId, maxAttempts],
      );
      return result.affectedRows === 1;
    },
    deleteSignInCode: async (codeId) => {
      const [result] = await db.query<ResultSetHeader>("DELETE FROM sign_in_codes WHERE id = ?", [codeId]);
      return result.affectedRows === 1;
    },
  };
}
