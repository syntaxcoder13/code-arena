export function displayAvatar(user: { customAvatarUrl?: string | null; avatarUrl?: string | null }): string {
  return user.customAvatarUrl || user.avatarUrl || '';
}
