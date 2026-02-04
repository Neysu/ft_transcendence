import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../lib/prisma';
import { findUserByIdOrUsername } from "../../../lib/api/userUtils";
import { UserIdParamSchema } from "../../../lib/api/schemasZod";
import { parseOrReply } from "../../../lib/api/validation";
import { authMiddleware } from "../../../middleware/auth";
import bcrypt from "bcrypt";
import { z } from "zod";

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function updatePassword(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // PUT /api/user/:id/password → change user password
    fastify.put("/:id/password",
      { preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const params = parseOrReply(UserIdParamSchema, request.params, reply);
          if (!params) {
            return;
          }
          const body = parseOrReply(UpdatePasswordSchema, request.body, reply);
          if (!body) {
            return;
          }

          const user = await findUserByIdOrUsername(params.id, { id: true, password: true });
          if (!user) {
            reply.code(404);
            return { status: "error", message: "User not found" };
          }

          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id || authUser.id !== user.id) {
            reply.code(403);
            return { status: "error", message: "Forbidden" };
          }

          // Verify current password
          const validPassword = await bcrypt.compare(body.currentPassword, user.password);
          if (!validPassword) {
            reply.code(401);
            return { status: "error", message: "Current password is incorrect" };
          }

          // Hash new password
          const hashedPassword = await bcrypt.hash(body.newPassword, 10);

          // Update password
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });

          return { status: "success", message: "Password updated successfully" };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to update password:");
          reply.code(500);
          return { status: "error", message: "Failed to update password" };
        }
      }
    );
  });
}
