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
  response: {
    200: userWithProfileSchema,
    401: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const createUserSchema = {
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
    500: errorResponse,
  },
};

export const deleteUserSchema = {
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
  response: {
    200: avatarOnlySchema,
    401: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const updateAvatarSchema = {
  params: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  body: {
    type: "object",
    required: ["profileImage"],
    properties: {
      profileImage: { type: "string" },
    },
  },
  security: authRequired,
  response: {
    200: avatarResponseSchema,
    400: errorResponseWithIssues,
    403: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const rpsPlaySchema = {
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
