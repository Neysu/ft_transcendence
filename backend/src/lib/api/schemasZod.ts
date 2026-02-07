import { z } from "zod";

const MoveEnum = z.enum(["ROCK", "PAPER", "SCISSORS"]);

// Schema for user registration
export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit faire au moins 3 caractères")
    .max(20, "Le nom d'utilisateur doit faire au plus 20 caractères")
    .regex(/^(?!\d+$).+$/, "Le nom d'utilisateur ne peut pas être uniquement des chiffres"),
  email: z.string().email("Format d'email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
    .regex(/[A-Z]/, "Il faut au moins une majuscule")
    .regex(/[0-9]/, "Il faut au moins un chiffre"),
});

export const LoginSchema = z
  .object({
    email: z.string().email("Format d'email invalide").optional(),
    username: z.string().min(1, "Le nom d'utilisateur est requis").optional(),
    password: z.string().min(1, "Le mot de passe est requis"),
  })
  .refine((data) => Boolean(data.email) !== Boolean(data.username), {
    message: "Utilisez soit email, soit username",
    path: ["email"],
  });

export const UpdateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit faire au moins 3 caractères")
      .max(20, "Le nom d'utilisateur doit faire au plus 20 caractères")
      .regex(/^(?!\d+$).+$/, "Le nom d'utilisateur ne peut pas être uniquement des chiffres")
      .optional(),
    email: z.string().email("Format d'email invalide").optional(),
  })
  .refine((data) => Boolean(data.username) || Boolean(data.email), {
    message: "Au moins un champ doit etre fourni",
    path: ["username"],
  });

export const UserIdParamSchema = z.object({
  id: z.string().min(1, "L'id est requis"),
});

export const RpsPlaySchema = z
  .object({
    player1: MoveEnum,
    player2: MoveEnum.optional(),
    useAI: z.boolean().optional().default(false),
  })
  .refine((data) => Boolean(data.useAI) || Boolean(data.player2), {
    message: "Fournir player2 ou activer useAI",
    path: ["player2"],
  });

export const FriendRequestSchema = z.object({
  toUserId: z.number().int().positive(),
});

export const FriendRequestTargetSchema = z.union([
  z.object({
    toUserId: z.number().int().positive(),
    toUsername: z.undefined().optional(),
  }),
  z.object({
    toUserId: z.undefined().optional(),
    toUsername: z.string().trim().min(1),
  }),
]);

export const FriendAcceptSchema = z.object({
  fromUserId: z.number().int().positive(),
});

export const FriendRejectSchema = z.object({
  fromUserId: z.number().int().positive(),
});

export const MessagesParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const MessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.coerce.number().int().positive().optional(),
});
