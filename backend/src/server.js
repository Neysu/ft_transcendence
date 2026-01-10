import Fastify from "fastify";

const fastify = Fastify({ logger: true });
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

await fastify.listen({port : 3000, host: '0.0.0.0'});
