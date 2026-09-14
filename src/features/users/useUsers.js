import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeUserRole,
  createUser,
  deleteUser,
  disableUser,
  enableUser,
  fetchUsers,
  updateUserProfile,
} from "./usersApi.js";

/**
 * Hooks de React Query para Usuarios (Fase 5). Cada mutación invalida
 * ["users"] al terminar, así que la tabla siempre refleja el estado
 * real que devuelve el backend después de editar, cambiar rol,
 * activar, desactivar o eliminar — nunca se simula el resultado
 * localmente.
 */
const USERS_KEY = ["users"];

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchUsers,
  });
}

function useUsersMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useCreateUser() {
  return useUsersMutation(({ nombre, email, rol }) => createUser({ nombre, email, rol }));
}

// Solo nombre/email — nunca toca el rol (ver usersApi.js).
export function useUpdateUserProfile() {
  return useUsersMutation(({ uid, nombre, email }) => updateUserProfile(uid, { nombre, email }));
}

// Solo rol — nunca toca nombre/email.
export function useChangeUserRole() {
  return useUsersMutation(({ uid, rol }) => changeUserRole(uid, rol));
}

export function useEnableUser() {
  return useUsersMutation((uid) => enableUser(uid));
}

export function useDisableUser() {
  return useUsersMutation((uid) => disableUser(uid));
}

export function useDeleteUser() {
  return useUsersMutation((uid) => deleteUser(uid));
}
