// 1. LES IMPORTS
import Fastify from "fastify";
import bcrypt from "bcrypt";
import { RegisterSchema } from "./lib/schemas"; // Assurez-vous d'avoir créé ce fichier (Etape 2 précédente)
import { prisma } from "./lib/prisma"; // Votre client Prisma configuré

const fastify = Fastify({ logger: true });

// --- VOS ROUTES EXISTANTES (POSTS) ---
const postSchema = {
  type: 'object',
  required: ['title', 'content'],
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: 'string', minLength: 1 }
  }
};

let posts = [{ id: '1', title: 'First Post', content: 'Hello World' }];

fastify.get('/posts', {
  schema: { response: { 200: { type: 'array', items: postSchema } } }
}, async () => posts);

fastify.post('/posts', {
  schema: { body: postSchema, response: { 201: postSchema } }
}, async (request, reply) => {
  const post = { id: Date.now().toString(), ...request.body };
  posts.push(post);
  reply.code(201);
  return post;
});

// --- 2. VOTRE NOUVELLE ROUTE D'INSCRIPTION ---
fastify.post('/register', async (request, reply) => {
  try {
    // A. Validation Zod
    const validatedData = RegisterSchema.parse(request.body);

    // B. Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return reply.code(409).send({ error: "Cet email est déjà utilisé." });
    }

    // C. Hashage
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // D. Création en base de données
    const newUser = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
      },
    });

    // On ne renvoie jamais le mot de passe, même hashé !
    return reply.code(201).send({ 
      id: newUser.id, 
      username: newUser.username, 
      email: newUser.email 
    });

  } catch (error) {
    // Gestion des erreurs Zod
    if (error.issues) {
      return reply.code(400).send({ error: error.issues });
    }
    // Autres erreurs
    request.log.error(error);
    return reply.code(500).send({ error: "Erreur interne serveur" });
  }
});

// --- 3. LANCEMENT DU SERVEUR (TOUJOURS A LA FIN) ---
try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}