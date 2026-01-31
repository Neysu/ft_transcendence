const errorResponse = {
  type: "object",
  properties: {
    status: { type: "string" },
    message: { type: "string" },
  },
};

const errorResponseWithIssues = {
  type: "object",
  properties: {
    status: { type: "string" },
    message: { type: "string" },
    issues: { type: "array" },
  },
};

const userBasicSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
    email: { type: "string" },
  },
};

const userPublicSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
  },
};

const userWithProfileSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
    email: { type: "string" },
    profileImage: { type: "string", nullable: true },
  },
};

const loginResponseSchema = {
  type: "object",
  properties: {
    token: { type: "string" },
    id: { type: "number" },
    username: { type: "string" },
    email: { type: "string" },
    profileImage: { type: "string", nullable: true },
  },
};

const avatarResponseSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
    profileImage: { type: "string" },
  },
};

const avatarOnlySchema = {
  type: "object",
  properties: {
    profileImage: { type: "string" },
  },
};

const moveEnum = { type: "string", enum: ["ROCK", "PAPER", "SCISSORS"] };

const authRequired = [{ bearerAuth: [] }];

export const healthSchema = {
  tags: ["system"],
  description: "Retourne l'état du service et de la base de données",
  summary: "Health check",
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        db: { type: "string" },
      },
    },
    500: errorResponse,
  },
};

export const getUsersSchema = {
  tags: ["users"],
  description: "Lister tous les utilisateurs",
  summary: "List users",
  response: {
    200: {
      type: "object",
      properties: {
        users: { type: "array", items: userPublicSchema },
      },
    },
    500: errorResponse,
  },
};

export const getUserByIdSchema = {
  tags: ["users"],
  description: "Récupérer un utilisateur par id ou username",
  summary: "Get user by id or username",
  params: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  response: {
    200: userPublicSchema,
    400: errorResponseWithIssues,
    404: errorResponse,
    500: errorResponse,
  },
};

export const getMeSchema = {
  security: authRequired,
  tags: ["users"],
  description: "Récupérer l'utilisateur connecté",
  summary: "Get current user",
  response: {
    200: userWithProfileSchema,
    401: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const createUserSchema = {
  tags: ["users"],
  description: "Créer un nouvel utilisateur",
  summary: "Create user",
  body: {
    type: "object",
    required: ["username", "email", "password"],
    properties: {
      username: { type: "string", minLength: 3, maxLength: 20 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
    },
  },
  response: {
    201: userBasicSchema,
    400: errorResponseWithIssues,
    409: errorResponse,
    500: errorResponse,
  },
};

export const updateUserSchema = {
  tags: ["users"],
  description: "Mettre à jour un utilisateur",
  summary: "Update user",
  params: {
    type: "object",
    properties: {
      id: { type: "string", description: "User id or username" },
    },
    required: ["id"],
  },
  body: {
    type: "object",
    properties: {
      username: { type: "string" },
      email: { type: "string", format: "email" },
    },
  },
  security: authRequired,
  response: {
    200: userBasicSchema,
    400: errorResponseWithIssues,
    403: errorResponse,
    404: errorResponse,
    409: errorResponse,
    500: errorResponse,
  },
};

export const deleteUserSchema = {
  tags: ["users"],
  description: "Supprimer un utilisateur",
  summary: "Delete user",
  params: {
    type: "object",
    properties: {
      id: { type: "string", description: "User id or username" },
    },
    required: ["id"],
  },
  security: authRequired,
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        deletedUser: userBasicSchema,
      },
    },
    400: errorResponseWithIssues,
    403: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const loginSchema = {
  tags: ["auth"],
  description: "Se connecter avec email ou username",
  summary: "Login",
  body: {
    type: "object",
    oneOf: [
      {
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
        },
      },
      {
        required: ["username", "password"],
        properties: {
          username: { type: "string" },
          password: { type: "string", minLength: 1 },
        },
      },
    ],
    properties: {
      email: { type: "string", format: "email" },
      username: { type: "string" },
      password: { type: "string", minLength: 1 },
    },
  },
  response: {
    200: loginResponseSchema,
    400: errorResponseWithIssues,
    401: errorResponse,
    500: errorResponse,
  },
};

export const getProfilePictureSchema = {
  tags: ["avatar"],
  description: "Récupérer l'avatar d'un utilisateur",
  summary: "Get user avatar",
  params: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  response: {
    200: avatarOnlySchema,
    400: errorResponseWithIssues,
    404: errorResponse,
    500: errorResponse,
  },
};

export const getProfilePictureMeSchema = {
  security: authRequired,
  tags: ["avatar"],
  description: "Récupérer l'avatar de l'utilisateur connecté",
  summary: "Get current user avatar",
  response: {
    200: avatarOnlySchema,
    401: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const updateAvatarSchema = {
  consumes: ["multipart/form-data"],
  tags: ["avatar"],
  description: "Mettre à jour l'avatar d'un utilisateur",
  summary: "Update user avatar",
  params: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  body: {
    type: "object",
    required: ["avatar"],
    properties: {
      avatar: {
        type: "string",
        format: "binary",
        description: "Avatar image file (multipart/form-data)",
      },
    },
  },
  security: authRequired,
  response: {
    200: avatarResponseSchema,
    400: {
      ...errorResponse,
      examples: [
        { status: "error", message: "Avatar file is required (field name: avatar)" },
        { status: "error", message: "Invalid file type (allowed: png, jpeg, jpg, webp, gif)" },
      ],
    },
    401: {
      ...errorResponse,
      examples: [{ status: "error", message: "Unauthorized: missing or invalid token" }],
    },
    403: {
      ...errorResponse,
      examples: [{ status: "error", message: "Forbidden: you can only change your own avatar" }],
    },
    404: errorResponse,
    413: {
      ...errorResponse,
      examples: [{ status: "error", message: "Avatar file too large (max 5MB)" }],
    },
    500: errorResponse,
  },
};

export const rpsPlaySchema = {
  tags: ["game"],
  summary: "Play RPS",
  body: {
    type: "object",
    required: ["player1"],
    properties: {
      player1: moveEnum,
      player2: moveEnum,
      useAI: { type: "boolean", default: false },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        player1: moveEnum,
        player2: moveEnum,
        outcome: { type: "string", enum: ["PLAYER1", "PLAYER2", "DRAW"] },
      },
    },
    400: errorResponseWithIssues,
    500: errorResponse,
  },
};

export const friendRequestSchema = {
  security: authRequired,
  description: "Envoyer une demande d'ami",
  tags: ["friends"],
  summary: "Send friend request",
  body: {
    type: "object",
    required: ["toUserId"],
    properties: {
      toUserId: { type: "number", description: "ID du destinataire" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
      examples: [
        { status: "success" },
        { status: "success", message: "Friend request accepted" },
      ],
    },
    400: errorResponseWithIssues,
    401: errorResponse,
    404: errorResponse,
    409: errorResponse,
    500: errorResponse,
  },
};

export const friendAcceptSchema = {
  security: authRequired,
  description: "Accepter une demande d'ami",
  tags: ["friends"],
  summary: "Accept friend request",
  body: {
    type: "object",
    required: ["fromUserId"],
    properties: {
      fromUserId: { type: "number", description: "ID de l'utilisateur qui a envoyé la demande" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
        message: { type: "string" },
      },
      examples: [
        { status: "success" },
        { status: "success", message: "Already friends" },
      ],
    },
    400: errorResponseWithIssues,
    401: errorResponse,
    404: errorResponse,
    409: {
      ...errorResponse,
      examples: [{ status: "error", message: "Friend request blocked" }],
    },
    500: errorResponse,
  },
};

export const getFriendsSchema = {
  security: authRequired,
  description: "Lister les amis (status ACCEPTED)",
  tags: ["friends"],
  summary: "List friends",
  response: {
    200: {
      type: "object",
      properties: {
        friends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              username: { type: "string" },
              profileImage: { type: "string", nullable: true },
            },
          },
        },
      },
      examples: [
        {
          friends: [{ id: 2, username: "bob", profileImage: "/public/2/avatar.webp" }],
        },
      ],
    },
    401: errorResponse,
    500: errorResponse,
  },
};

const friendRequestItemSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    user: {
      type: "object",
      properties: {
        id: { type: "number" },
        username: { type: "string" },
        profileImage: { type: "string", nullable: true },
      },
    },
  },
};

const messageItemSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    content: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    senderId: { type: "number" },
    receiverId: { type: "number" },
  },
};

export const getFriendRequestsSchema = {
  security: authRequired,
  description: "Lister les demandes d'amis reçues (PENDING)",
  tags: ["friends"],
  summary: "List received friend requests",
  response: {
    200: {
      type: "object",
      properties: {
        requests: { type: "array", items: friendRequestItemSchema },
      },
      examples: [
        {
          requests: [
            {
              id: 12,
              status: "PENDING",
              createdAt: "2026-01-25T22:15:00.000Z",
              user: { id: 2, username: "bob", profileImage: null },
            },
          ],
        },
      ],
    },
    401: errorResponse,
    500: errorResponse,
  },
};

export const getFriendRequestsSentSchema = {
  security: authRequired,
  description: "Lister les demandes d'amis envoyées (PENDING)",
  tags: ["friends"],
  summary: "List sent friend requests",
  response: {
    200: {
      type: "object",
      properties: {
        requests: { type: "array", items: friendRequestItemSchema },
      },
      examples: [
        {
          requests: [
            {
              id: 15,
              status: "PENDING",
              createdAt: "2026-01-25T22:20:00.000Z",
              user: { id: 3, username: "alice", profileImage: "/public/3/avatar.webp" },
            },
          ],
        },
      ],
    },
    401: errorResponse,
    500: errorResponse,
  },
};

export const getMessagesSchema = {
  security: authRequired,
  description: "Historique des messages avec un ami",
  tags: ["messages"],
  summary: "List direct messages",
  params: {
    type: "object",
    properties: {
      userId: { type: "string" },
    },
    required: ["userId"],
  },
  querystring: {
    type: "object",
    properties: {
      limit: { type: "number", minimum: 1, maximum: 100 },
      cursor: { type: "number" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        messages: { type: "array", items: messageItemSchema },
        nextCursor: { type: ["number", "null"] },
      },
      examples: [
        {
          messages: [
            {
              id: 41,
              content: "salut !",
              createdAt: "2026-01-25T22:29:00.000Z",
              senderId: 1,
              receiverId: 2,
            },
            {
              id: 42,
              content: "hey",
              createdAt: "2026-01-25T22:30:00.000Z",
              senderId: 2,
              receiverId: 1,
            },
          ],
          nextCursor: 41,
        },
      ],
    },
    400: errorResponseWithIssues,
    401: errorResponse,
    403: errorResponse,
    500: errorResponse,
  },
};

export const friendRejectSchema = {
  security: authRequired,
  description: "Refuser une demande d'ami",
  tags: ["friends"],
  summary: "Reject friend request",
  body: {
    type: "object",
    required: ["fromUserId"],
    properties: {
      fromUserId: { type: "number", description: "ID de l'utilisateur qui a envoyé la demande" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
      },
      examples: [{ status: "success" }],
    },
    400: errorResponseWithIssues,
    401: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const friendCancelSchema = {
  security: authRequired,
  description: "Annuler une demande d'ami envoyée",
  tags: ["friends"],
  summary: "Cancel sent friend request",
  body: {
    type: "object",
    required: ["toUserId"],
    properties: {
      toUserId: { type: "number", description: "ID du destinataire" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string" },
      },
      examples: [{ status: "success" }],
    },
    400: errorResponseWithIssues,
    401: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};
