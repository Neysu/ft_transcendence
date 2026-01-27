import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Nettoyage des données existantes...");
  
  // Supprimer les données existantes (dans l'ordre pour respecter les contraintes)
  await prisma.message.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Création des utilisateurs...");
  
  // Créer 3 utilisateurs : Alice, Bob, Charlie
  const alice = await prisma.user.create({
    data: {
      username: "Alice",
      email: "alice@example.com",
      password: "password123",
    },
  });
  console.log(`   ✅ Alice créée (id: ${alice.id})`);

  const bob = await prisma.user.create({
    data: {
      username: "Bob",
      email: "bob@example.com",
      password: "password123",
    },
  });
  console.log(`   ✅ Bob créé (id: ${bob.id})`);

  const charlie = await prisma.user.create({
    data: {
      username: "Charlie",
      email: "charlie@example.com",
      password: "password123",
    },
  });
  console.log(`   ✅ Charlie créé (id: ${charlie.id})`);

  console.log("\n🤝 Création de la relation d'amitié entre Alice et Bob...");
  
  // Rendre Alice et Bob amis (relation bidirectionnelle)
  await prisma.user.update({
    where: { id: alice.id },
    data: {
      friends: {
        connect: { id: bob.id },
      },
    },
  });
  
  // Pour une relation symétrique, on connecte aussi dans l'autre sens
  await prisma.user.update({
    where: { id: bob.id },
    data: {
      friends: {
        connect: { id: alice.id },
      },
    },
  });
  console.log("   ✅ Alice et Bob sont maintenant amis !");

  console.log("\n💬 Envoi d'un message d'Alice à Bob...");
  
  // Faire envoyer un message par Alice à Bob
  const message = await prisma.message.create({
    data: {
      content: "Salut Bob !",
      senderId: alice.id,
      receiverId: bob.id,
    },
  });
  console.log(`   ✅ Message envoyé (id: ${message.id})`);

  console.log("\n" + "=".repeat(50));
  console.log("📊 VÉRIFICATION DES DONNÉES");
  console.log("=".repeat(50));

  // Récupérer Alice avec ses amis et ses messages envoyés
  const aliceWithRelations = await prisma.user.findUnique({
    where: { id: alice.id },
    include: {
      friends: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      sentMessages: {
        include: {
          receiver: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  console.log("\n👥 Liste des amis d'Alice:");
  if (aliceWithRelations?.friends.length === 0) {
    console.log("   (Aucun ami)");
  } else {
    aliceWithRelations?.friends.forEach((friend) => {
      console.log(`   - ${friend.username} (${friend.email})`);
    });
  }

  console.log("\n📨 Messages envoyés par Alice:");
  if (aliceWithRelations?.sentMessages.length === 0) {
    console.log("   (Aucun message)");
  } else {
    aliceWithRelations?.sentMessages.forEach((msg) => {
      console.log(`   - À ${msg.receiver.username}: "${msg.content}" (${msg.createdAt.toLocaleString()})`);
    });
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Test terminé avec succès !");
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
