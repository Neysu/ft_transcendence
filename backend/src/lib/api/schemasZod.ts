import { z } from 'zod';

// Schema for user registration
export const RegisterSchema = z.object({
  username: z
            .string().min(3, "Le nom d'utilisateur doit faire au moins 3 caractères")
            .max(20, "Le nom d'utilisateur doit faire au plus 20 caractères")
            .regex(/^(?!\d+$).+$/, "Le nom d'utilisateur ne peut pas être uniquement des chiffres"),

  email: z.string().email("Format d'email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
    .regex(/[A-Z]/, "Il faut au moins une majuscule")
    .regex(/[0-9]/, "Il faut au moins un chiffre"),
});
