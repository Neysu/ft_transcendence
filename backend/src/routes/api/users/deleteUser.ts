import type { FastifyInstance } from "fastify";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../../lib/prisma";
import { findUserByIdOrUsername } from "../../../lib/api/userUtils";
import { UserIdParamSchema } from "../../../lib/api/schemasZod";
import { parseOrReply } from "../../../lib/api/validation";
import { deleteUserSchema } from "../../../swagger/schemas";
import { authMiddleware } from "../../../middleware/auth";

type UserDeleteTx = {
  message: typeof prisma.message;
  friendship: typeof prisma.friendship;
  post: typeof prisma.post;
  user: typeof prisma.user;
};

export async function deleteUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // DELETE /api/user/:id → supprimer un utilisateur par id ou username
    fastify.delete("/:id",
      { schema: deleteUserSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
      try {
        const params = parseOrReply(UserIdParamSchema, request.params, reply);
        if (!params) {
          return;
        }
        const user = await findUserByIdOrUsername(params.id, {
          id: true,
          username: true,
          email: true,
          profileImage: true,
        });

        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }
        const authUser = (request as { user?: { id?: number } }).user;
        if (!authUser?.id || authUser.id !== user.id) {
          reply.code(403);
          return { status: "error", message: "Forbidden" };
        }

        const profileImage = user.profileImage;
        await prisma.$transaction(async (tx: UserDeleteTx) => {
          await tx.message.deleteMany({
            where: {
              OR: [{ senderId: user.id }, { receiverId: user.id }],
            },
          });
          await tx.friendship.deleteMany({
            where: {
              OR: [{ requesterId: user.id }, { addresseeId: user.id }],
            },
          });
          await tx.post.deleteMany({ where: { authorId: user.id } });
          await tx.user.delete({ where: { id: user.id } });
        });
        if (profileImage && profileImage.startsWith(`/public/${user.id}/`)) {
          const filePath = path.join(process.cwd(), profileImage.slice(1));
          try {
            await unlink(filePath);
          } catch {}
        }
        const { profileImage: _ignoredProfileImage, ...deletedUser } = user;
        return { status: "success", deletedUser };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to delete user:");
        reply.code(500);
        return { status: "error", message: "Failed to delete user" };
      }
      }
    );
  });
}
